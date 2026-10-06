import hashlib
from datetime import datetime

class DriftDetectionEngine:
    RISK_WEIGHTS = {
        'security_group': 30,
        's3_public_access': 30,
        'iam_policy': 25,
        'ec2_config': 15,
        'tag_change': 5,
        'env_variable': 10,
        'nginx_config': 20,
    }
    
    SEVERITY_THRESHOLDS = {
        'CRITICAL': 80,
        'HIGH': 60,
        'MEDIUM': 30,
        'LOW': 0,
    }
    
    def _compute_hash(self, content: str) -> str:
        """SHA-256 hash of content."""
        if not content:
            return ''
        return hashlib.sha256(content.encode('utf-8')).hexdigest()
    
    def _detect_change_type(self, config_name: str) -> str:
        """Determine the type of config based on its name."""
        name_lower = config_name.lower()
        if 'security' in name_lower or 'sg' in name_lower:
            return 'security_group'
        if 's3' in name_lower:
            return 's3_public_access'
        if 'iam' in name_lower or 'policy' in name_lower:
            return 'iam_policy'
        if 'ec2' in name_lower:
            return 'ec2_config'
        if 'nginx' in name_lower:
            return 'nginx_config'
        if '.env' in name_lower or 'env' in name_lower:
            return 'env_variable'
        return 'tag_change'

    def calculate_risk_score(self, config_name: str, drift_type: str, changes: dict) -> int:
        """Calculate risk score (0-100) based on what changed."""
        base_score = self.RISK_WEIGHTS.get(drift_type, 10)
        # simplistic calculation, could be more advanced
        return min(base_score * 2, 100)
    
    def classify_severity(self, risk_score: int) -> str:
        """Map risk score to severity level."""
        if risk_score >= self.SEVERITY_THRESHOLDS['CRITICAL']:
            return 'CRITICAL'
        if risk_score >= self.SEVERITY_THRESHOLDS['HIGH']:
            return 'HIGH'
        if risk_score >= self.SEVERITY_THRESHOLDS['MEDIUM']:
            return 'MEDIUM'
        return 'LOW'

    def compare_configs(self, baseline: dict, current: dict) -> list[dict]:
        """Compare baseline snapshot with current configs. Return list of drifts."""
        drifts = []
        all_keys = set(baseline.keys()).union(set(current.keys()))
        
        for key in all_keys:
            baseline_val = baseline.get(key, '')
            current_val = current.get(key, '')
            
            baseline_hash = self._compute_hash(baseline_val)
            current_hash = self._compute_hash(current_val)
            
            if baseline_hash != current_hash:
                drift_type = self._detect_change_type(key)
                risk_score = self.calculate_risk_score(key, drift_type, {})
                severity = self.classify_severity(risk_score)
                
                drifts.append({
                    'config_name': key,
                    'expected_hash': baseline_hash,
                    'actual_hash': current_hash,
                    'drift_detected': True,
                    'risk_score': risk_score,
                    'severity': severity,
                    'details': f'Content drift detected in {key}'
                })
                
        return drifts
    
    def generate_drift_report(self, baseline_name: str, environment: str, drifts: list) -> dict:
        """Generate a complete drift report."""
        overall_risk = sum(d['risk_score'] for d in drifts)
        if len(drifts) > 0:
            overall_risk = min(int(overall_risk / len(drifts) + max(d['risk_score'] for d in drifts)) // 2, 100)
        else:
            overall_risk = 0
            
        return {
            'baseline_name': baseline_name,
            'environment': environment,
            'drifts': drifts,
            'overall_risk_score': overall_risk,
            'scan_timestamp': datetime.utcnow().isoformat()
        }
