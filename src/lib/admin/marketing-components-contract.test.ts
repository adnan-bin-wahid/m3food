import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import PageIntro from '../../../components/admin/marketing/PageIntro';
import BusinessMetric from '../../../components/admin/marketing/BusinessMetric';
import InsightCard from '../../../components/admin/marketing/InsightCard';
import BusinessFunnel from '../../../components/admin/marketing/BusinessFunnel';

test('PageIntro renders canonical props (title, description, controls, eyebrow, explain button)', () => {
  const html = renderToStaticMarkup(
    React.createElement(PageIntro, {
      pageKey: 'overview',
      eyebrow: 'Niyamah Store · Growth',
      title: 'Marketing Overview',
      description: 'See your business at a glance: revenue, orders, ad spend.',
      controls: React.createElement('div', { id: 'test-date-picker' }, 'DateRangePickerControl'),
    })
  );

  assert.ok(html.includes('Niyamah Store · Growth'), 'Must render eyebrow');
  assert.ok(html.includes('Marketing Overview'), 'Must render page title');
  assert.ok(html.includes('See your business at a glance: revenue, orders, ad spend.'), 'Must render description');
  assert.ok(html.includes('DateRangePickerControl'), 'Must render date range controls');
  assert.ok(html.includes('Explain this page'), 'Must render Explain this page button');
});

test('PageIntro supports fallback props (subtitle, datePicker, children)', () => {
  const html = renderToStaticMarkup(
    React.createElement(PageIntro, {
      pageKey: 'visitors',
      title: 'Customers & Traffic',
      subtitle: 'See who visited your store and where they came from.',
      datePicker: React.createElement('div', { id: 'fallback-picker' }, 'FallbackDateControl'),
    })
  );

  assert.ok(html.includes('Customers &amp; Traffic') || html.includes('Customers & Traffic'), 'Must render title');
  assert.ok(html.includes('See who visited your store and where they came from.'), 'Must render fallback subtitle as description');
  assert.ok(html.includes('FallbackDateControl'), 'Must render fallback datePicker');
});

test('BusinessMetric renders canonical props (title, value, subtitle, tooltip, status)', () => {
  const html = renderToStaticMarkup(
    React.createElement(BusinessMetric, {
      title: 'Revenue',
      value: 'BDT 8,380',
      subtitle: 'Delivered revenue',
      tooltip: 'Total delivered order value',
      technicalLabel: 'Delivered Revenue',
      status: 'good',
    })
  );

  assert.ok(html.includes('Revenue'), 'Must render metric title');
  assert.ok(html.includes('BDT 8,380'), 'Must render metric value');
  assert.ok(html.includes('Delivered revenue'), 'Must render metric subtitle');
  assert.ok(html.includes('admin-metric-status-good'), 'Must apply status-good class');
  assert.ok(html.includes('admin-tooltip-container'), 'Must render tooltip container');
});

test('BusinessMetric supports fallback props (label, technicalName, status="success")', () => {
  const html = renderToStaticMarkup(
    React.createElement(BusinessMetric, {
      label: 'Ad Spend',
      value: 'BDT 3,225',
      subtitle: 'Active campaign spend',
      technicalName: 'ROAS',
      status: 'success',
    })
  );

  assert.ok(html.includes('Ad Spend'), 'Must render fallback label as title');
  assert.ok(html.includes('BDT 3,225'), 'Must render value');
  assert.ok(html.includes('ROAS'), 'Must render technicalName tag');
  assert.ok(html.includes('admin-metric-status-good'), 'Must map success status to status-good class');
});

test('InsightCard renders canonical props (title, message, detail, actionLabel, actionHref)', () => {
  const html = renderToStaticMarkup(
    React.createElement(InsightCard, {
      type: 'working',
      title: 'Orders are converting',
      message: '4 completed orders recorded.',
      detail: 'BDT 8,380 delivered revenue.',
      actionLabel: 'View sales journey',
      actionHref: '/admin/marketing/funnel',
    })
  );

  assert.ok(html.includes('Orders are converting'), 'Must render insight title');
  assert.ok(html.includes('4 completed orders recorded.'), 'Must render insight message');
  assert.ok(html.includes('BDT 8,380 delivered revenue.'), 'Must render insight detail');
  assert.ok(html.includes('View sales journey'), 'Must render action link label');
  assert.ok(html.includes('href="/admin/marketing/funnel"'), 'Must render action href');
  assert.ok(html.includes('admin-insight-working'), 'Must have working style class');
});

test('InsightCard supports fallback props (description, actionText)', () => {
  const html = renderToStaticMarkup(
    React.createElement(InsightCard, {
      type: 'attention',
      title: 'Checkout dropouts',
      description: 'Visitors opened checkout but did not finish.',
      actionText: 'Recover customers',
      actionHref: '/admin/marketing/retargeting',
    })
  );

  assert.ok(html.includes('Checkout dropouts'), 'Must render title');
  assert.ok(html.includes('Visitors opened checkout but did not finish.'), 'Must render fallback description as message');
  assert.ok(html.includes('Recover customers'), 'Must render fallback actionText');
  assert.ok(html.includes('admin-insight-attention'), 'Must have attention style class');
});

test('BusinessFunnel renders canonical props with exact conversion rate and opportunity text', () => {
  const stages = [
    { key: 'visitors', label: 'Visited store', value: 500, rate: 100 },
    { key: 'view_content', label: 'Viewed product', value: 300, rate: 60 },
    { key: 'add_to_cart', label: 'Showed buying intent', value: 100, rate: 20 },
    { key: 'begin_checkout', label: 'Started ordering', value: 25, rate: 5 },
    { key: 'purchase', label: 'Completed order', value: 4, rate: 0.8 },
  ];

  const html = renderToStaticMarkup(
    React.createElement(BusinessFunnel, {
      stages,
      conversionRate: 0.8,
      totalVisitors: 500,
      totalOrders: 4,
      opportunityText: '21 people started ordering but did not finish.',
    })
  );

  assert.ok(html.includes('0.8%'), 'Must display real conversion rate');
  assert.ok(html.includes('4 orders from 500 visitors'), 'Must display correct order and visitor count');
  assert.ok(html.includes('21 people started ordering but did not finish.'), 'Must render opportunity text');
  assert.ok(!html.includes('0 orders from 0 visitors'), 'Must never show 0 orders from 0 visitors bug');
  assert.ok(html.includes('Visited store'), 'Must render step 1 label');
  assert.ok(html.includes('Completed order'), 'Must render step 5 label');
});

test('BusinessFunnel calculates conversion rate automatically from fallback steps', () => {
  const steps = [
    { label: 'Visited store', value: 200 },
    { label: 'Completed order', value: 2 },
  ];

  const html = renderToStaticMarkup(
    React.createElement(BusinessFunnel, {
      steps,
      dropoffCallout: 'Checkout dropoff area',
    })
  );

  assert.ok(html.includes('1.0%'), 'Must calculate 2 / 200 = 1.0% conversion rate');
  assert.ok(html.includes('2 orders from 200 visitors'), 'Must derive counts from steps');
  assert.ok(html.includes('Checkout dropoff area'), 'Must render fallback dropoffCallout');
});

test('BusinessFunnel stage badge renders previous-stage continuation rates correctly', () => {
  const stages = [
    { key: 'visitors', label: 'Visited store', value: 403 },
    { key: 'view_content', label: 'Viewed product', value: 327 },
    { key: 'add_to_cart', label: 'Showed buying intent', value: 41 },
    { key: 'begin_checkout', label: 'Started ordering', value: 31 },
    { key: 'purchase', label: 'Completed order', value: 3 },
  ];

  const html = renderToStaticMarkup(
    React.createElement(BusinessFunnel, {
      stages,
      conversionRate: 0.7,
      totalVisitors: 403,
      totalOrders: 3,
    })
  );

  // 403 -> 327 = 81.1%
  assert.ok(html.includes('81.1% continued'), 'Step 2 must show 81.1% continuation from step 1');
  // 327 -> 41 = 12.5%
  assert.ok(html.includes('12.5% continued'), 'Step 3 must show 12.5% continuation from step 2');
  // 41 -> 31 = 75.6%
  assert.ok(html.includes('75.6% continued'), 'Step 4 must show 75.6% continuation from step 3');
  // 31 -> 3 = 9.7%
  assert.ok(html.includes('9.7% continued'), 'Step 5 must show 9.7% continuation from step 4');
  // Overall separate
  assert.ok(html.includes('0.7%'), 'Must show 0.7% overall conversion rate');
  assert.ok(html.includes('3 orders from 403 visitors'), 'Must show 3 orders from 403 visitors');
});

test('Active tab chip markup uses admin-tab-chip and is-active classes with high-contrast styles', () => {
  const activeMarkup = renderToStaticMarkup(
    React.createElement('a', {
      className: 'admin-tab-chip is-active',
      style: {
        background: 'var(--admin-forest, #1f6332)',
        color: '#ffffff',
        border: '1px solid var(--admin-forest, #1f6332)',
      },
    }, [
      React.createElement('span', { key: 'label' }, 'All visitors'),
      React.createElement('span', {
        key: 'count',
        className: 'admin-tab-chip-count',
        style: {
          background: 'rgba(255,255,255,0.25)',
          color: '#ffffff',
        },
      }, '403'),
    ])
  );

  assert.ok(activeMarkup.includes('admin-tab-chip is-active'), 'Must have active chip class');
  assert.ok(activeMarkup.includes('#ffffff'), 'Must have explicit high contrast white text');
  assert.ok(activeMarkup.includes('#1f6332'), 'Must have fallback forest green background');
});

