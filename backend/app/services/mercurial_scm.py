import subprocess
import os
import json
from pathlib import Path

class MercurialSCM:
    def __init__(self, repo_path: str):
        self.repo_path = os.path.abspath(repo_path)
    
    def _run_command(self, cmd: list[str]) -> tuple[str, str, int]:
        """Run a shell command and return (stdout, stderr, returncode)."""
        try:
            result = subprocess.run(
                cmd,
                cwd=self.repo_path,
                capture_output=True,
                text=True
            )
            return result.stdout, result.stderr, result.returncode
        except Exception as e:
            return '', str(e), -1

    def init_repo(self) -> dict:
        """Initialize a new Mercurial repository."""
        if not os.path.exists(self.repo_path):
            os.makedirs(self.repo_path, exist_ok=True)
        
        stdout, stderr, code = self._run_command(['hg', 'init'])
        if code == 0:
            return {'success': True, 'message': 'Repository initialized.'}
        return {'success': False, 'error': stderr}
    
    def add_file(self, file_path: str) -> dict:
        """Add a file to tracking."""
        stdout, stderr, code = self._run_command(['hg', 'add', file_path])
        if code == 0:
            return {'success': True, 'message': f'Added {file_path}'}
        return {'success': False, 'error': stderr}
    
    def commit(self, message: str, user: str = 'CloudGuard') -> dict:
        """Commit changes."""
        stdout, stderr, code = self._run_command(['hg', 'commit', '-m', message, '-u', user])
        if code == 0:
            # get the hash of the latest commit
            out, err, c = self._run_command(['hg', 'id', '-i'])
            return {'success': True, 'hash': out.strip()}
        return {'success': False, 'error': stderr}
    
    def log(self, limit: int = 10) -> list[dict]:
        """Get commit history."""
        # Using a simple template to parse easily
        template = '{node}|{desc}|{author}|{date|isodatesec}\n'
        stdout, stderr, code = self._run_command(['hg', 'log', '--limit', str(limit), '--template', template])
        
        history = []
        if code == 0 and stdout:
            for line in stdout.strip().split('\n'):
                if line:
                    parts = line.split('|', 3)
                    if len(parts) == 4:
                        history.append({
                            'hash': parts[0],
                            'message': parts[1],
                            'user': parts[2],
                            'date': parts[3]
                        })
        return history
    
    def diff(self, file_path: str = None) -> str:
        """Get diff of uncommitted changes."""
        cmd = ['hg', 'diff']
        if file_path:
            cmd.append(file_path)
        stdout, stderr, code = self._run_command(cmd)
        return stdout
    
    def tag(self, tag_name: str, message: str = None) -> dict:
        """Tag the current revision."""
        cmd = ['hg', 'tag', tag_name]
        if message:
            cmd.extend(['-m', message])
        stdout, stderr, code = self._run_command(cmd)
        if code == 0:
            return {'success': True, 'message': f'Tagged as {tag_name}'}
        return {'success': False, 'error': stderr}
    
    def cat(self, file_path: str, rev: str = None) -> str:
        """Get file content at a specific revision."""
        cmd = ['hg', 'cat']
        if rev:
            cmd.extend(['-r', rev])
        cmd.append(file_path)
        stdout, stderr, code = self._run_command(cmd)
        if code == 0:
            return stdout
        return ''
