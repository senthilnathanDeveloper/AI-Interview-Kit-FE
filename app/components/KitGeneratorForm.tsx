'use client';

import React, { useState } from 'react';
import { Sparkles, Globe, Calendar, FileText, Upload, Layers } from 'lucide-react';

interface KitGeneratorFormProps {
  onSubmit: (jd: string, companyUrl: string, days: number) => void;
  onBatchSubmit: (cases: Array<{ id?: string; jd: string; company_url: string; days?: number }>) => void;
  isGenerating: boolean;
}

export default function KitGeneratorForm({ onSubmit, onBatchSubmit, isGenerating }: KitGeneratorFormProps) {
  const [activeTab, setActiveTab] = useState<'single' | 'batch'>('single');
  const [jd, setJd] = useState('');
  const [companyUrl, setCompanyUrl] = useState('');
  const [days, setDays] = useState(5);
  const [batchFile, setBatchFile] = useState<File | null>(null);
  const [batchError, setBatchError] = useState('');

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!jd.trim()) return;
    onSubmit(jd, companyUrl, days);
  };

  const handleBatchFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setBatchFile(e.target.files[0]);
      setBatchError('');
    }
  };

  const handleBatchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!batchFile) return;

    try {
      const text = await batchFile.text();
      const cases = JSON.parse(text);
      if (!Array.isArray(cases)) {
        throw new Error('Batch file must contain a JSON array of case objects.');
      }
      onBatchSubmit(cases);
    } catch (err: any) {
      setBatchError(err.message || 'Invalid JSON file structure.');
    }
  };

  return (
    <div className="w-full glass-panel rounded-2xl p-6 shadow-2xl border border-white/10">
      <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Generate Prep Kit
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            Input job posting & company details to build your multi-pass research kit
          </p>
        </div>

        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-white/10">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
              activeTab === 'single'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Single Job
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('batch')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1 ${
              activeTab === 'batch'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Batch Upload
          </button>
        </div>
      </div>

      {activeTab === 'single' ? (
        <form onSubmit={handleSingleSubmit} className="space-y-5">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-indigo-400" />
                Job Description *
              </label>
              <span className="text-xs text-gray-500">{jd.length} characters</span>
            </div>
            <textarea
              required
              rows={6}
              value={jd}
              onChange={(e) => setJd(e.target.value)}
              placeholder="Paste job description text here... (e.g. Senior Backend Engineer with Node.js, Express, and MongoDB experience)"
              className="w-full bg-slate-900/60 border border-white/10 rounded-xl p-3.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-indigo-400" />
                Company Website URL
              </label>
              <input
                type="url"
                value={companyUrl}
                onChange={(e) => setCompanyUrl(e.target.value)}
                placeholder="https://company.com"
                className="w-full bg-slate-900/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors placeholder:text-gray-600"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-indigo-400" />
                  Days Before Interview
                </label>
                <span className="text-xs font-bold text-indigo-400">{days} Days</span>
              </div>
              <input
                type="range"
                min={1}
                max={30}
                value={days}
                onChange={(e) => setDays(parseInt(e.target.value, 10))}
                className="w-full accent-indigo-500 bg-slate-800 h-2 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !jd.trim()}
            className="w-full py-3.5 px-6 gradient-btn text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Executing Pipeline & Research...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Generate Interview Prep Kit
              </>
            )}
          </button>
        </form>
      ) : (
        <form onSubmit={handleBatchSubmit} className="space-y-4">
          <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-indigo-500/50 transition-colors bg-slate-900/40">
            <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white mb-1">
              Upload JSON Batch File
            </p>
            <p className="text-xs text-gray-400 mb-4">
              Select a JSON file containing an array of cases with `jd`, `company_url`, and `days`.
            </p>

            <input
              type="file"
              accept=".json"
              onChange={handleBatchFileChange}
              className="text-xs text-gray-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 file:cursor-pointer"
            />
          </div>

          {batchError && (
            <p className="text-xs text-red-400 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
              {batchError}
            </p>
          )}

          <button
            type="submit"
            disabled={isGenerating || !batchFile}
            className="w-full py-3.5 px-6 gradient-btn text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-lg disabled:opacity-50"
          >
            {isGenerating ? 'Processing Batch...' : 'Generate Batch Kits'}
          </button>
        </form>
      )}
    </div>
  );
}
