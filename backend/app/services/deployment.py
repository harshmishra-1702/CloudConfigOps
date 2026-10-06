import paramiko
from datetime import datetime
import os
import hashlib

class DeploymentService:
    def __init__(self, host: str, username: str, key_path: str, port: int = 22):
        self.host = host
        self.username = username
        self.key_path = os.path.expanduser(key_path)
        self.port = port
    
    def _get_client(self):
        client = paramiko.SSHClient()
        client.set_missing_host_key_policy(paramiko.AutoAddPolicy())
        key = paramiko.RSAKey.from_private_key_file(self.key_path)
        client.connect(hostname=self.host, port=self.port, username=self.username, pkey=key, timeout=10)
        return client

    async def deploy_config(self, local_path: str, remote_path: str, restart_command: str = None) -> dict:
        """Deploy a config file to the target server via SFTP and optionally restart the service."""
        client = None
        try:
            client = self._get_client()
            sftp = client.open_sftp()
            sftp.put(local_path, remote_path)
            sftp.close()
            
            msg = f'Successfully deployed to {remote_path}'
            
            if restart_command:
                stdin, stdout, stderr = client.exec_command(restart_command)
                exit_status = stdout.channel.recv_exit_status()
                if exit_status == 0:
                    msg += f' and ran restart command: {restart_command}'
                else:
                    return {'success': False, 'message': f'Deployment succeeded but restart failed: {stderr.read().decode()}', 'timestamp': datetime.utcnow().isoformat()}

            return {'success': True, 'message': msg, 'timestamp': datetime.utcnow().isoformat()}
        except Exception as e:
            return {'success': False, 'message': str(e), 'timestamp': datetime.utcnow().isoformat()}
        finally:
            if client:
                client.close()
    
    async def verify_deployment(self, remote_path: str, expected_hash: str) -> dict:
        """Verify deployed file matches expected content."""
        client = None
        try:
            client = self._get_client()
            stdin, stdout, stderr = client.exec_command(f'cat {remote_path}')
            content = stdout.read()
            if not content:
                return {'success': False, 'message': 'File is empty or does not exist on remote.', 'match': False}
            
            actual_hash = hashlib.sha256(content).hexdigest()
            match = actual_hash == expected_hash
            
            return {
                'success': True,
                'match': match,
                'actual_hash': actual_hash,
                'expected_hash': expected_hash
            }
        except Exception as e:
            return {'success': False, 'message': str(e)}
        finally:
            if client:
                client.close()
    
    async def execute_command(self, command: str) -> dict:
        """Execute a command on the remote server."""
        client = None
        try:
            client = self._get_client()
            stdin, stdout, stderr = client.exec_command(command)
            return {
                'success': True,
                'stdout': stdout.read().decode(),
                'stderr': stderr.read().decode(),
                'exit_code': stdout.channel.recv_exit_status()
            }
        except Exception as e:
            return {'success': False, 'error': str(e)}
        finally:
            if client:
                client.close()
    
    async def test_connection(self) -> dict:
        """Test SSH connectivity."""
        client = None
        try:
            client = self._get_client()
            return {'success': True, 'message': 'Connection successful'}
        except Exception as e:
            return {'success': False, 'message': f'Connection failed: {str(e)}'}
        finally:
            if client:
                client.close()
