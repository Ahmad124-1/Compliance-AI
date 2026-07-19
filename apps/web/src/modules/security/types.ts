export interface SecurityCheck {
  id: string;
  category: 'rbac' | 'isolation' | 'auth' | 'data' | 'audit';
  title: string;
  status: 'pass' | 'warn' | 'fail';
  detail: string;
}

export interface SecurityReport {
  generatedAt: string;
  score: number;
  checks: SecurityCheck[];
}
