import path from "path"
import fs from "fs"
import { execSync } from "child_process"
import react from "@vitejs/plugin-react"
import { defineConfig, type Plugin } from "vite"

// 自定义插件：数据导出 + 一键构建推送
function exportQueryDataPlugin(): Plugin {
  const projectDir = path.resolve(__dirname)

  return {
    name: 'export-query-data',
    configureServer(server) {
      // 端点1：导出学生数据到 public/data/students.json
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
            const dir = path.resolve(projectDir, 'public/data')
            if (!fs.existsSync(dir)) {
              fs.mkdirSync(dir, { recursive: true })
            }
            fs.writeFileSync(
              path.resolve(dir, 'students.json'),
              JSON.stringify(data, null, 2),
              'utf-8'
            )
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
  plugins: [react(), exportQueryDataPlugin()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
