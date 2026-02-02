'use client';

/**
 * Image Integration System Admin Page
 * Web interface for monitoring and managing the image system
 * Requirements: 8.3
 */

import React from 'react';
import { AdminDashboard } from '../../../lib/images/components/admin-dashboard';

export default function ImageSystemAdminPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <AdminDashboard className="min-h-screen" />
      </div>
    </div>
  );
}