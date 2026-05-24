import path from "path"
import fs from "fs"
import { execSync } from "child_process"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// 插件1：构建时保护 docs/data/students.json 不被 public/ 的陈旧数据覆盖
// 策略：构建前备份 docs/ 数据，构建后按备份恢复（因为 Vite 复制 public→docs 发生在 writeBundle 之前）
function preserveDataPlugin(): Plugin {
  const projectDir = path.resolve(__dirname)
  let docsBackup: string | null = null

  return {
    name: 'preserve-data',
    buildStart() {
      // 确保 public/data 目录存在
      const publicDataDir = path.resolve(projectDir, 'public/data')
      if (!fs.existsSync(publicDataDir)) {
        fs.mkdirSync(publicDataDir, { recursive: true })
      }

      // 构建前备份 docs/data/students.json —— 这是部署在 GitHub Pages 上的真实数据
      const docsPath = path.resolve(projectDir, 'docs/data/students.json')
      if (fs.existsSync(docsPath)) {
        docsBackup = fs.readFileSync(docsPath, 'utf-8')
      }
    },
    writeBundle(options: any) {
      const outDir = options?.dir || ''

      // Electron 构建（outDir = dist）：清空学生数据，安装包不带用户数据
      if (typeof outDir === 'string' && (outDir.endsWith('/dist') || outDir === 'dist')) {
        const distDataPath = path.resolve(projectDir, outDir, 'data/students.json')
        if (fs.existsSync(distDataPath)) {
          fs.writeFileSync(distDataPath, JSON.stringify({ students: [] }, null, 2), 'utf-8')
          console.log('🧹 Electron 安装包已清空学生数据')
        }
        return
      }

      // GitHub Pages 构建（outDir = docs）：用备份恢复，防止 public/ 的陈旧数据污染
      if (docsBackup) {
        const docsPath = path.resolve(projectDir, 'docs/data/students.json')
        const publicPath = path.resolve(projectDir, 'public/data/students.json')

        try {
          const backupData = JSON.parse(docsBackup)
          const docsData = fs.existsSync(docsPath)
            ? JSON.parse(fs.readFileSync(docsPath, 'utf-8'))
            : null
          const backupCount = backupData.students?.length || 0
          const docsCount = docsData?.students?.length || 0

          if (backupCount > docsCount) {
            // 备份比构建后更多 → 被 Vite 覆盖了，恢复
            fs.writeFileSync(docsPath, docsBackup, 'utf-8')
            fs.writeFileSync(publicPath, docsBackup, 'utf-8')
            console.log(`📦 已用备份恢复 ${backupCount} 条学生数据（构建前 docs 有 ${backupCount} 条，构建后仅 ${docsCount} 条）`)
          } else if (backupCount > 0) {
            // 数据正常，把 docs 回写 public（保持种子新鲜）
            fs.writeFileSync(publicPath, docsBackup, 'utf-8')
            console.log(`📦 数据完好，已同步 ${backupCount} 条到 public/ 种子`)
          }
        } catch (e) {
          console.warn('⚠️ 数据恢复失败:', e)
        }
      }
    },
  }
}

// 插件2：数据导出 + 一键构建推送
function exportQueryDataPlugin(): Plugin {
  const projectDir = path.resolve(__dirname)

  return {
    name: 'export-query-data',
    configureServer(server) {
      // 端点1：导出学生数据 -> 同时写入 public/（dev server 用）和 docs/（部署用）
      server.middlewares.use('/api/export-query-data', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        let body = ''
        req.on('data', (chunk: Buffer) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const data = JSON.parse(body)
            const content = JSON.stringify(data, null, 2)

            // 写入 public/data/（dev server 热加载用）
            const publicDir = path.resolve(projectDir, 'public/data')
            if (!fs.existsSync(publicDir)) {
              fs.mkdirSync(publicDir, { recursive: true })
            }
            fs.writeFileSync(path.resolve(publicDir, 'students.json'), content, 'utf-8')

            // 同时写入 docs/data/（GitHub Pages 部署用）
            const docsDir = path.resolve(projectDir, 'docs/data')
            if (!fs.existsSync(docsDir)) {
              fs.mkdirSync(docsDir, { recursive: true })
            }
            fs.writeFileSync(path.resolve(docsDir, 'students.json'), content, 'utf-8')

            res.statusCode = 200
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true, count: data.students?.length || 0 }))
          } catch (e: any) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: false, error: e.message }))
          }
        })
      })

      // 端点2：一键构建 + 提交 + 推送到 GitHub
      server.middlewares.use('/api/sync-to-github', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }

        const logs: string[] = []
        try {
          // Step 1: 构建
          logs.push('🔨 开始构建...')
          execSync('npm run build', { cwd: projectDir, stdio: 'pipe', timeout: 60000 })
          logs.push('✅ 构建完成')

          // Step 2: git add
          logs.push('📦 暂存文件...')
          execSync('git add docs/', { cwd: projectDir, stdio: 'pipe' })

          // Step 3: commit (仅当有变更时)
          try {
            execSync('git diff --cached --quiet', { cwd: projectDir })
            logs.push('ℹ️ 无新变更，跳过提交')
          } catch {
            const ts = new Date().toISOString().replace('T', ' ').substring(0, 19)
            execSync(`git commit -m "sync: ${ts}"`, { cwd: projectDir, stdio: 'pipe' })
            logs.push('✅ 提交完成')
          }

          // Step 4: push
          logs.push('🚀 推送到 GitHub...')
          execSync('git push', { cwd: projectDir, stdio: 'pipe', timeout: 30000 })
          logs.push('✅ 推送成功！GitHub Pages 将在 1-2 分钟内更新')

          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, logs }))
        } catch (e: any) {
          logs.push('❌ 失败: ' + (e.stderr?.toString() || e.message))
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: false, error: e.stderr?.toString() || e.message, logs }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  build: {
    outDir: 'docs',
  },
  plugins: [react(), preserveDataPlugin(), exportQueryDataPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
