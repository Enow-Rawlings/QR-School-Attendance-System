'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface Section {
  title: string;
  content: string[];
}

const EULA_SECTIONS: Section[] = [
  {
    title: 'Data Collection & Privacy',
    content: [
      'We collect essential information including your student/staff ID, full name, email address, department, academic level, and class assignment.',
      'Your biometric data (webcam photos during attendance) is collected solely for attendance verification and fraud prevention purposes.',
      'We do NOT collect, store, or process any other personal or sensitive data without your explicit consent.',
      'All data collection is in compliance with university policies and applicable data protection regulations.',
    ],
  },
  {
    title: 'Data Usage & Purpose',
    content: [
      'Attendance tracking and academic records management for your courses.',
      'Verifying your identity during attendance marking to prevent proxy attendance.',
      'Generating attendance reports and statistics for academic departments.',
      'Improving system security and preventing unauthorized access or fraudulent attendance.',
      'No data is used for marketing, profiling, or any purpose beyond academic administration.',
    ],
  },
  {
    title: 'Data Protection & Security',
    content: [
      'All data is encrypted in transit using HTTPS/TLS protocols.',
      'Personal information is stored securely using industry-standard encryption at rest.',
      'Access to attendance records is restricted to authorized personnel (your lecturer and department administrators).',
      'We perform regular security audits and maintain comprehensive logging of data access.',
      'In case of a security breach, affected users will be notified within 24 hours.',
    ],
  },
  {
    title: 'Data Retention & Deletion',
    content: [
      'Attendance records are retained for the duration of your academic program plus 2 years for archival purposes.',
      'Your profile photo and biometric data from attendance sessions are deleted 6 months after course completion.',
      'You have the right to request deletion of your personal data, subject to legal and academic record-keeping requirements.',
      'Upon graduation or program completion, you may request complete data deletion where legally permissible.',
    ],
  },
  {
    title: 'Your Rights & Responsibilities',
    content: [
      'You have the right to access all your personal data stored in the system at any time.',
      'You can request corrections to inaccurate information about yourself.',
      'You are responsible for maintaining the confidentiality of your login credentials.',
      'You agree not to use the system to assist others in marking fake attendance.',
      'Misuse of the system for fraudulent attendance may result in academic disciplinary action.',
    ],
  },
  {
    title: 'System Limitations & Disclaimer',
    content: [
      'The system is provided "as-is" without warranty. While we strive for 100% uptime, we do not guarantee uninterrupted service.',
      'Technical failures or system downtime may occasionally prevent attendance marking within the scheduled time window.',
      'Users agree to follow all instructions provided within the system and by course lecturers.',
      'The university reserves the right to modify this agreement with 7 days notice to all users.',
    ],
  },
  {
    title: 'Contact & Support',
    content: [
      'For privacy concerns or data access requests, contact: [IT Department Email]',
      'For technical support with the attendance system: [Support Email]',
      'For academic appeals related to attendance: Contact your department administrator',
      'Complaints can be escalated to the University Data Protection Officer if not resolved satisfactorily.',
    ],
  },
];

export default function EULAPage() {
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set());
  const [accepted, setAccepted] = useState(false);

  const toggleSection = (index: number) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4">
            End User License Agreement
          </h1>
          <p className="text-lg text-gray-300">
            QR Attendance System for Landmark Metropolitan University of Buea
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Last Updated: May 2026 | Version 1.0
          </p>
        </div>

        {/* Introduction Card */}
        <div className="glass rounded-2xl p-8 mb-8 animate-slide-in-up border border-white/20">
          <h2 className="text-2xl font-semibold text-white mb-4">Welcome to Our System</h2>
          <p className="text-gray-300 leading-relaxed mb-4">
            This QR Attendance System is designed to streamline attendance tracking at Landmark Metropolitan University of Buea while protecting your privacy and data. By registering and using this system, you agree to the terms outlined below.
          </p>
          <p className="text-gray-300 leading-relaxed">
            We are committed to transparency about how we collect, use, and protect your personal data. Please take time to read through each section carefully.
          </p>
        </div>

        {/* Expandable Sections */}
        <div className="space-y-4 mb-8">
          {EULA_SECTIONS.map((section, index) => (
            <div
              key={index}
              className="glass rounded-xl border border-white/20 overflow-hidden animate-slide-in-up transition-smooth"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <button
                onClick={() => toggleSection(index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/5 transition-smooth"
              >
                <h3 className="text-lg font-semibold text-white text-left">{section.title}</h3>
                {expandedSections.has(index) ? (
                  <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-cyan-400 flex-shrink-0 ml-4" />
                )}
              </button>

              {expandedSections.has(index) && (
                <div className="px-6 py-4 border-t border-white/10 bg-white/5">
                  <ul className="space-y-3">
                    {section.content.map((item, itemIndex) => (
                      <li key={itemIndex} className="flex gap-3">
                        <span className="text-cyan-400 font-bold flex-shrink-0 mt-1">•</span>
                        <span className="text-gray-300 text-sm leading-relaxed">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Acceptance Section */}
        <div className="glass rounded-2xl p-8 border border-white/20 animate-slide-in-up">
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-4">Acceptance & Acknowledgment</h3>
            <p className="text-gray-300 mb-6">
              By checking the box below and clicking "I Accept", you acknowledge that:
            </p>
            <ul className="space-y-2 text-gray-300 text-sm">
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span>You have read and understood all sections of this agreement</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span>You consent to the collection and use of your data as described</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span>You understand your rights and responsibilities</span>
              </li>
              <li className="flex gap-3">
                <span className="text-cyan-400 font-bold flex-shrink-0">✓</span>
                <span>You agree to abide by all system policies and academic integrity standards</span>
              </li>
            </ul>
          </div>

          <div className="border-t border-white/10 pt-6">
            <label className="flex items-start gap-3 cursor-pointer group">
              <Checkbox
                checked={accepted}
                onCheckedChange={(checked) => setAccepted(checked as boolean)}
                className="mt-1"
              />
              <span className="text-gray-300 group-hover:text-white transition-smooth">
                I have read, understood, and agree to the End User License Agreement and Privacy Policy
              </span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4 mt-8 justify-center sm:justify-end animate-slide-in-up">
          <Link href="/login">
            <Button variant="outline" className="rounded-xl">
              Decline & Go Back
            </Button>
          </Link>
          <Link href={accepted ? '/register' : '#'}>
            <Button
              disabled={!accepted}
              className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 rounded-xl text-white"
            >
              I Accept & Continue
            </Button>
          </Link>
        </div>

        {/* Footer */}
        <p className="text-center text-gray-400 text-xs mt-8">
          © 2026 Landmark Metropolitan University of Buea. All rights reserved.
        </p>
      </div>
    </div>
  );
}
