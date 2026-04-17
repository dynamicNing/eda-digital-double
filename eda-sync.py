#!/usr/bin/env python3
"""
E大数字分身 - GitHub同步脚本
监控 ~/Downloads/eda-posts/ 文件夹，新MD文件自动提交到GitHub

使用方法:
  python3 eda-sync.py                    # 前台运行
  python3 eda-sync.py --daemon           # 后台运行
  python3 eda-sync.py --install          # 安装为定时任务（每小时检查）
"""

import os
import sys
import time
import json
import subprocess
import hashlib
from datetime import datetime
from pathlib import Path
import argparse

# 配置
GITHUB_ROOT = Path("/Users/dynamic/Documents/GitHub")
TARGET_REPO = GITHUB_ROOT / "eda-digital-double"
POSTS_DIR = TARGET_REPO / "posts"
WATCH_DIR = Path.home() / "Downloads" / "eda-posts"
STATE_FILE = TARGET_REPO / ".eda-sync-state.json"
LOG_FILE = TARGET_REPO / ".eda-sync.log"


def log(msg):
    ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    line = f"[{ts}] {msg}"
    print(line)
    with open(LOG_FILE, "a") as f:
        f.write(line + "\n")


def load_state():
    if STATE_FILE.exists():
        return json.loads(STATE_FILE.read_text())
    return {}


def save_state(state):
    STATE_FILE.write_text(json.dumps(state, indent=2))


def ensure_dirs():
    WATCH_DIR.mkdir(parents=True, exist_ok=True)
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    if not (TARGET_REPO / ".git").exists():
        log(f"❌ {TARGET_REPO} 不是一个git仓库")
        sys.exit(1)


def compute_file_hash(path):
    with open(path, "rb") as f:
        return hashlib.md5(f.read()).hexdigest()[:8]


def process_file(md_file, state):
    """处理单个MD文件"""
    filename = md_file.name
    file_hash = compute_file_hash(md_file)
    
    # 检查是否已处理
    if state.get(filename) == file_hash:
        log(f"⏭  跳过（未变）: {filename}")
        return False
    
    # 读取内容
    content = md_file.read_text(encoding="utf-8")
    
    # 生成文件名: posts/2026-04-17-abc123.md
    date_prefix = datetime.now().strftime("%Y-%m-%d")
    base_name = md_file.stem[:50]  # 截断长名字
    dest_name = f"{date_prefix}-{file_hash}-{base_name}.md"
    dest_path = POSTS_DIR / dest_name
    
    # 避免重名
    counter = 1
    while dest_path.exists():
        dest_name = f"{date_prefix}-{file_hash}-{base_name}-{counter}.md"
        dest_path = POSTS_DIR / dest_name
        counter += 1
    
    # 复制到posts目录
    dest_path.write_text(content, encoding="utf-8")
    log(f"✅ 保存: {dest_path.name} ({len(content)} bytes)")
    
    # 备份原始文件（标记为已处理）
    state[filename] = file_hash
    save_state(state)
    
    # 标记原始文件为已处理（改名）
    processed_name = md_file.with_suffix(".md.processed")
    if not processed_name.exists():
        md_file.rename(processed_name)
    
    return dest_path


def git_add_commit(posts_dir):
    """Git add + commit"""
    os.chdir(TARGET_REPO)
    
    # 检查是否有变更
    result = subprocess.run(["git", "status", "--porcelain", str(POSTS_DIR)], 
                           capture_output=True, text=True)
    if not result.stdout.strip():
        log("⏭  没有新变更")
        return False
    
    # Git add
    subprocess.run(["git", "add", str(POSTS_DIR)], check=True)
    
    # Commit with timestamp
    ts = datetime.now().strftime("%Y-%m-%d %H:%M")
    msg = f"📝 E大帖子更新 {ts}"
    subprocess.run(["git", "commit", "-m", msg], check=True)
    
    # Push
    result = subprocess.run(["git", "push", "origin", "main"], 
                           capture_output=True, text=True)
    if result.returncode != 0:
        log(f"⚠️  Push失败: {result.stderr}")
        return False
    
    log("✅ 已推送至GitHub")
    return True


def scan_and_sync(state):
    """扫描监听文件夹，同步变更"""
    if not WATCH_DIR.exists():
        return
    
    md_files = list(WATCH_DIR.glob("*.md"))
    if not md_files:
        log(f"📁 监听中... ({WATCH_DIR})")
        return
    
    log(f"🔍 发现 {len(md_files)} 个新文件")
    committed = False
    
    for f in md_files:
        try:
            result = process_file(f, state)
            if result:
                git_add_commit(POSTS_DIR)
                committed = True
        except Exception as e:
            log(f"❌ 处理失败 {f.name}: {e}")
    
    return committed


def install_cron():
    """安装每小时执行的定时任务"""
    script_path = Path(__file__).resolve()
    cron_cmd = f"cd {script_path.parent} && /usr/bin/python3 {script_path} --daemon"
    cron_line = f"0 * * * * {cron_cmd} >> {LOG_FILE} 2>&1\n"
    
    # 读取现有crontab
    result = subprocess.run(["crontab", "-l"], capture_output=True, text=True)
    existing = result.stdout if result.returncode == 0 else ""
    
    # 检查是否已安装
    if "eda-sync.py" in existing and "--daemon" in existing:
        print("✅ 定时任务已存在，无需重复安装")
        return
    
    # 添加新crontab
    new_crontab = existing + cron_line
    proc = subprocess.run(["crontab", "-"], input=new_crontab, text=True, 
                         capture_output=True)
    if proc.returncode == 0:
        print("✅ 已安装每小时定时任务")
        print(f"   命令: python3 {script_path} --daemon")
        print(f"   日志: {LOG_FILE}")
    else:
        print(f"❌ 安装失败: {proc.stderr}")


def main():
    parser = argparse.ArgumentParser(description="E大数字分身 GitHub同步")
    parser.add_argument("--daemon", action="store_true", help="后台持续监控")
    parser.add_argument("--once", action="store_true", help="单次扫描")
    parser.add_argument("--install", action="store_true", help="安装为定时任务（每小时检查）")
    args = parser.parse_args()
    
    if args.install:
        install_cron()
        return
    
    ensure_dirs()
    state = load_state()
    
    if args.once or not args.daemon:
        # 单次运行
        scan_and_sync(state)
    else:
        # 守护进程模式
        log("🚀 E大数字分身 GitHub同步已启动")
        log(f"📂 监听: {WATCH_DIR}")
        log(f"📁 目标: {POSTS_DIR}")
        while True:
            scan_and_sync(state)
            time.sleep(30)  # 每30秒检查一次


if __name__ == "__main__":
    main()
