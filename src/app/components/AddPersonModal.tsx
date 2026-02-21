"use client";

import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { FamilyData } from '@/types/family';
import { DataSource } from '@/data/familyDataWithIds';

interface AddPersonModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  familyData: FamilyData;
  dataSource: DataSource;
}

export default function AddPersonModal({ open, onClose, onSuccess, familyData, dataSource }: AddPersonModalProps) {
  const [name, setName] = useState('');
  const [info, setInfo] = useState('');
  const [generation, setGeneration] = useState('');
  const [newGeneration, setNewGeneration] = useState('');
  const [fatherId, setFatherId] = useState('');
  const [birthYear, setBirthYear] = useState('');
  const [deathYear, setDeathYear] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!open) return null;

  const generations = familyData.generations.map(g => g.title);

  const allPeople = familyData.generations.flatMap(g =>
    g.people.map(p => ({ id: p.id, name: p.name, gen: g.title }))
  );

  const selectedGenTitle = generation === '__new__' ? newGeneration : generation;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!name.trim()) { setError('请输入姓名'); return; }
    if (!selectedGenTitle.trim()) { setError('请选择或输入世代'); return; }

    setSubmitting(true);
    try {
      const res = await fetch('/api/family-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: dataSource,
          generation: selectedGenTitle,
          person: {
            name: name.trim(),
            info: info.trim(),
            fatherId: fatherId || undefined,
            birthYear: birthYear ? parseInt(birthYear) : undefined,
            deathYear: deathYear ? parseInt(deathYear) : undefined,
          },
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || '添加失败');
      }

      // Reset form
      setName(''); setInfo(''); setGeneration(''); setNewGeneration('');
      setFatherId(''); setBirthYear(''); setDeathYear('');
      onSuccess();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '添加失败');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-800">添加新人物</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-md hover:bg-gray-100">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              placeholder="请输入姓名"
            />
          </div>

          {/* Generation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              所属世代 <span className="text-red-500">*</span>
            </label>
            <select
              value={generation}
              onChange={(e) => setGeneration(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">请选择世代</option>
              {generations.map((g) => (
                <option key={g} value={g}>{g}</option>
              ))}
              <option value="__new__">+ 新建世代</option>
            </select>
            {generation === '__new__' && (
              <input
                type="text"
                value={newGeneration}
                onChange={(e) => setNewGeneration(e.target.value)}
                className="w-full mt-2 px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder='例如: 第23世'
              />
            )}
          </div>

          {/* Father */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">父亲</label>
            <select
              value={fatherId}
              onChange={(e) => setFatherId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
            >
              <option value="">无 / 未知</option>
              {allPeople.map((p) => (
                <option key={p.id} value={p.id}>{p.name}（{p.gen}）</option>
              ))}
            </select>
          </div>

          {/* Info */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">简介</label>
            <textarea
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              placeholder="请输入人物简介"
            />
          </div>

          {/* Years */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">出生年份</label>
              <input
                type="number"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="例如: 1920"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">去世年份</label>
              <input
                type="number"
                value={deathYear}
                onChange={(e) => setDeathYear(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-900 bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                placeholder="例如: 2000"
              />
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              取消
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
              添加
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
