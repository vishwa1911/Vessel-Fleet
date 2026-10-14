import React from 'react';
import { Link } from 'react-router-dom';
import { Anchor, ArrowLeft } from 'lucide-react';

export const NotFound = () => {
  return (
    <div className="min-h-screen bg-maritime-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="p-4 bg-ocean-500/10 border border-ocean-500/20 rounded-2xl text-ocean-400 mb-4">
        <Anchor className="w-12 h-12 animate-pulse" />
      </div>
      <h1 className="text-4xl font-extrabold text-white tracking-tight">404 - Charted Coordinates Not Found</h1>
      <p className="mt-2 text-sm text-slate-400 max-w-md">
        The navigational route or resource you are attempting to access does not exist or has drifted off course.
      </p>
      <Link
        to="/dashboard"
        className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 bg-ocean-600 hover:bg-ocean-500 text-white font-medium text-xs rounded-lg transition shadow-lg shadow-ocean-600/30"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Return to Fleet Operations Dashboard</span>
      </Link>
    </div>
  );
};
