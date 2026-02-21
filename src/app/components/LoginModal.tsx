"use client";

import { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FamilyData } from '@/types/family';

interface LoginModalProps {
  open: boolean;
  onClose: () => void;
  onLoginSuccess: (token: string, personId: string, name: string) => void;
  familyData: FamilyData;
}

export default function LoginModal({ open, onClose, onLoginSuccess, familyData }: LoginModalProps) {
  const [personId, setPersonId] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingPassword, setCheckingPassword] = useState(false);

  const allPeople = familyData.generations.flatMap(g =>
    g.people.map(p => ({ id: p.id, name: p.name, gen: g.title }))
  );

  const selectedPerson = allPeople.find(p => p.id === personId);

  // Check if selected person has a password set
  useEffect(() => {
    if (!personId) { setIsRegister(false); return; }
    setCheckingPassword(true);
    setError('');
    fetch('/api/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'check', personId }),
    })
      .then(res => res.json())
      .then(data => setIsRegister(!data.hasPassword))
      .catch(() => {})
      .finally(() => setCheckingPassword(false));
  }, [personId]);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!personId || !password) { setError('请选择人物并输入密码'); return; }
    if (isRegister && password !== confirmPassword) { setError('两次输入的密码不一致'); return; }
    if (password.length < 4) { setError('密码至少 4 位'); return; }

    setLoading(true);
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: isRegister ? 'register' : 'login',
          personId,
          name: selectedPerson?.name,
          password,
        }),
      });
      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.token, personId, selectedPerson?.name || '');
        onClose();
        setPersonId(''); setPassword(''); setConfirmPassword('');
      } else {
        setError(data.message || '操作失败');
      }
    } catch {
      setError('请求失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">
            {isRegister ? '首次登录 — 设置密码' : '登录'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">选择你的姓名</label>
            <select
              value={personId}
              onChange={e => setPersonId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择</option>
              {allPeople.map(p => (
                <option key={p.id} value={p.id}>{p.name}（{p.gen}）</option>
              ))}
            </select>
          </div>

          {personId && !checkingPassword && (
            <>
              {isRegister && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg">
                  该账号尚未设置密码，请在下方设置密码完成注册。
                </p>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {isRegister ? '设置密码' : '密码'}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                  placeholder="请输入密码（至少4位）"
                />
              </div>

              {isRegister && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">确认密码</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="再次输入密码"
                  />
                </div>
              )}
            </>
          )}

          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200">
              取消
            </button>
            <button
              type="submit"
              disabled={loading || !personId || checkingPassword}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              {isRegister ? '注册并登录' : '登录'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
