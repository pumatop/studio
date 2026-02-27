'use client';

/**
 * هذا الملف يعمل كموزع رئيسي لخدمات Firebase.
 * تم نقل منطق التهيئة إلى init.ts لتفادي أخطاء الاستيراد الدائري.
 */

export * from './init';
export * from './provider';
export * from './client-provider';
export * from './errors';
export * from './error-emitter';
export * from './rtdb/use-rtdb-list';
export * from './rtdb/use-rtdb-object';
export * from './rtdb/mutations';
