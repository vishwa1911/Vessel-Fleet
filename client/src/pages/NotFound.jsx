import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-white to-sky-100 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-sky-50 border border-sky-200 rounded-2xl text-sky-600 mb-4 shadow-sm">
        <Anchor className="w-12 h-12 animate-pulse" />
      </div>
      <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">404 - Charted Coordinates Not Found</h1>
      <p className="mt-2 text-sm text-slate-500 max-w-md font-medium">
        The navigational route or resource you are attempting to access does not exist or has drifted off course.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-sky-500 hover:bg-sky-600 text-white font-semibold text-xs rounded-xl transition shadow-lg shadow-sky-500/25"
      >
        <ArrowLeft className="w-4 h-4 text-white" />
        <span className="text-white">Return to Fleet Operations Dashboard</span>
      </Link>
    </div>
  );
};
