import subprocess
import time

REPO_PATH = '~/Desktop/Website/banwave.live'  
CHECK_INTERVAL = 30  

def run_git_command(command):
    """Run a Git command in the specified repository directory."""
    try:
        result = subprocess.run(command, cwd=REPO_PATH, text=True, capture_output=True)
        return result
    except Exception as e:
        print(f"Error running command {command}: {e}")
        return None

def check_for_updates():
    """Check for updates in the Git repository."""

    fetch_result = run_git_command(['git', 'fetch'])
    if fetch_result and fetch_result.returncode == 0:
        print("Fetched latest changes.")

        status_result = run_git_command(['git', 'status', '-uno'])  
        if status_result and "Your branch is behind" in status_result.stdout:
            print("Updates found. Pulling changes...")
            pull_result = run_git_command(['git', 'pull'])
            if pull_result and pull_result.returncode == 0:
                print("Updates pulled successfully.")
            else:
                print("Failed to pull updates.")
        else:
            print("No updates found.")
    else:
        print("Failed to fetch changes.")

if __name__ == "__main__":
    while True:
        check_for_updates()
        time.sleep(CHECK_INTERVAL)