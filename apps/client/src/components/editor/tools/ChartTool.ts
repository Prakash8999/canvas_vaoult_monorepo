/**
 * Chart Block Tool for EditorJS
 * Creates inline data visualizations from JSON/CSV data
 */

import { API, BlockTool, BlockToolConstructorOptions, BlockToolData } from '@editorjs/editorjs';

interface ChartData extends BlockToolData {
  data: string; // JSON or CSV data
  chartType: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
  title?: string;
  xAxis?: string;
  yAxis?: string;
  width?: number;
  height?: number;
}

interface ChartConfig {
  defaultWidth?: number;
  defaultHeight?: number;
}

export class ChartTool implements BlockTool {
  private api: API;
  private config: ChartConfig;
  private data: ChartData;
  private wrapper: HTMLElement | null = null;
  private dataEditor: HTMLTextAreaElement | null = null;
  private chartContainer: HTMLElement | null = null;
  
  static get toolbox() {
    return {
      title: 'Chart',
      icon: `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="20" x2="18" y2="10"></line>
        <line x1="12" y1="20" x2="12" y2="4"></line>
        <line x1="6" y1="20" x2="6" y2="14"></line>
      </svg>`,
    };
  }
  
  static get sanitize() {
    return {
      data: false,
      chartType: false,
      title: false,
      xAxis: false,
      yAxis: false,
      width: false,
      height: false,
    };
  }
  
  constructor({ data, config, api }: BlockToolConstructorOptions) {
    this.api = api;
    this.config = config || {};
    this.data = data as ChartData || {
      data: '',
      chartType: 'bar',
      title: '',
      xAxis: '',
      yAxis: '',
      width: this.config.defaultWidth || 600,
      height: this.config.defaultHeight || 400,
    };
  }
  
  render(): HTMLElement {
    this.wrapper = document.createElement('div');
    this.wrapper.className = 'chart-block border border-gray-200 rounded-lg overflow-hidden bg-white';
    
    // Header with controls
    const header = document.createElement('div');
    header.className = 'flex items-center gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200 flex-wrap';
    
    // Chart type selector
    const chartTypeSelect = document.createElement('select');
    chartTypeSelect.className = 'text-sm border border-gray-300 rounded px-2 py-1';
    chartTypeSelect.innerHTML = `
      <option value="bar" ${this.data.chartType === 'bar' ? 'selected' : ''}>Bar Chart</option>
      <option value="line" ${this.data.chartType === 'line' ? 'selected' : ''}>Line Chart</option>
      <option value="pie" ${this.data.chartType === 'pie' ? 'selected' : ''}>Pie Chart</option>
      <option value="area" ${this.data.chartType === 'area' ? 'selected' : ''}>Area Chart</option>
      <option value="scatter" ${this.data.chartType === 'scatter' ? 'selected' : ''}>Scatter Plot</option>
    `;
    
    chartTypeSelect.addEventListener('change', (e) => {
      const target = e.target as HTMLSelectElement;
      this.data.chartType = target.value as ChartData['chartType'];
      this.renderChart();
    });
    
    // Title input
    const titleInput = document.createElement('input');
    titleInput.type = 'text';
    titleInput.placeholder = 'Chart title';
    titleInput.className = 'text-sm border border-gray-300 rounded px-2 py-1 flex-1 min-w-0';
    titleInput.value = this.data.title || '';
    
    titleInput.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement;
      this.data.title = target.value;
      this.renderChart();
    });
    
    // Render button
    const renderButton = document.createElement('button');
    renderButton.className = 'px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors';
    renderButton.textContent = 'Render Chart';
    renderButton.addEventListener('click', () => this.renderChart());
    
    header.appendChild(document.createTextNode('Type: '));
    header.appendChild(chartTypeSelect);
    header.appendChild(titleInput);
    header.appendChild(renderButton);
    
    // Data editor
    const editorContainer = document.createElement('div');
    editorContainer.className = 'relative';
    
    const editorLabel = document.createElement('div');
    editorLabel.className = 'px-4 py-2 text-sm text-gray-600 bg-gray-50 border-b border-gray-200';
    editorLabel.innerHTML = `
      Data (JSON format): 
      <code class="text-xs bg-gray-200 px-1 rounded">
        [{"name": "A", "value": 10}, {"name": "B", "value": 20}]
      </code>
    `;
    
    this.dataEditor = document.createElement('textarea');
    this.dataEditor.className = 'w-full h-32 p-4 font-mono text-sm border-none resize-y focus:outline-none';
    this.dataEditor.placeholder = `Enter data in JSON format:
[
  {"name": "Category A", "value": 30},
  {"name": "Category B", "value": 45},
  {"name": "Category C", "value": 25}
]`;
    this.dataEditor.value = this.data.data || '';
    this.dataEditor.spellcheck = false;
    
    this.dataEditor.addEventListener('input', (e) => {
      const target = e.target as HTMLTextAreaElement;
      this.data.data = target.value;
    });
    
    editorContainer.appendChild(editorLabel);
    editorContainer.appendChild(this.dataEditor);
    
    // Chart container
    this.chartContainer = document.createElement('div');
    this.chartContainer.className = 'p-4 min-h-64';
    
    this.wrapper.appendChild(header);
    this.wrapper.appendChild(editorContainer);
    this.wrapper.appendChild(this.chartContainer);
    
    // Render chart if data exists
    if (this.data.data) {
      this.renderChart();
    }
    
    return this.wrapper;
  }
  
  private renderChart() {
    if (!this.chartContainer || !this.data.data.trim()) {
      if (this.chartContainer) {
        this.chartContainer.innerHTML = `
          <div class="flex items-center justify-center h-32 text-gray-500 text-sm">
            Enter data above and click "Render Chart" to visualize
          </div>
        `;
      }
      return;
    }
    
    try {
      const parsedData = JSON.parse(this.data.data);
      if (!Array.isArray(parsedData)) {
        throw new Error('Data must be an array');
      }
      
      this.createChart(parsedData);
    } catch (error) {
      this.chartContainer.innerHTML = `
        <div class="flex items-center justify-center h-32 text-red-500 text-sm">
          Error parsing data: ${error instanceof Error ? error.message : 'Invalid JSON'}
        </div>
      `;
    }
  }
  
  private createChart(data: any[]) {
    if (!this.chartContainer) return;
    
    // Simple SVG chart implementation
    const width = this.data.width || 600;
    const height = this.data.height || 400;
    const margin = { top: 40, right: 40, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;
    
    let svg = `<svg width="${width}" height="${height}" class="border border-gray-200 rounded">`;
    
    // Title
    if (this.data.title) {
      svg += `<text x="${width / 2}" y="20" text-anchor="middle" class="text-lg font-semibold fill-gray-800">${this.data.title}</text>`;
    }
    
    if (this.data.chartType === 'bar') {
      svg += this.createBarChart(data, margin, chartWidth, chartHeight);
    } else if (this.data.chartType === 'line') {
      svg += this.createLineChart(data, margin, chartWidth, chartHeight);
    } else if (this.data.chartType === 'pie') {
      svg += this.createPieChart(data, width, height);
    } else {
      svg += `<text x="${width / 2}" y="${height / 2}" text-anchor="middle" class="fill-gray-500">Chart type "${this.data.chartType}" not implemented yet</text>`;
    }
    
    svg += '</svg>';
    
    this.chartContainer.innerHTML = svg;
  }
  
  private createBarChart(data: any[], margin: any, chartWidth: number, chartHeight: number): string {
    const maxValue = Math.max(...data.map(d => d.value || 0));
    const barWidth = chartWidth / data.length * 0.8;
    const barSpacing = chartWidth / data.length * 0.2;
    
    let bars = '';
    data.forEach((item, i) => {
      const value = item.value || 0;
      const barHeight = (value / maxValue) * chartHeight;
      const x = margin.left + i * (barWidth + barSpacing) + barSpacing / 2;
      const y = margin.top + chartHeight - barHeight;
      
      bars += `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${barHeight}" 
              class="fill-blue-500 hover:fill-blue-600" stroke="none">
          <title>${item.name || `Item ${i + 1}`}: ${value}</title>
        </rect>
        <text x="${x + barWidth / 2}" y="${margin.top + chartHeight + 20}" 
              text-anchor="middle" class="text-sm fill-gray-600">
          ${item.name || `Item ${i + 1}`}
        </text>
      `;
    });
    
    // Y-axis
    const yAxisTicks = 5;
    let yAxis = '';
    for (let i = 0; i <= yAxisTicks; i++) {
      const value = (maxValue / yAxisTicks) * i;
      const y = margin.top + chartHeight - (i / yAxisTicks) * chartHeight;
      yAxis += `
        <line x1="${margin.left - 5}" y1="${y}" x2="${margin.left}" y2="${y}" 
              class="stroke-gray-400" stroke-width="1"></line>
        <text x="${margin.left - 10}" y="${y + 4}" text-anchor="end" 
              class="text-xs fill-gray-600">${Math.round(value)}</text>
      `;
    }
    
    return `
      <g>
        ${bars}
        ${yAxis}
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" 
              class="stroke-gray-400" stroke-width="2"></line>
        <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" 
              class="stroke-gray-400" stroke-width="2"></line>
      </g>
    `;
  }
  
  private createLineChart(data: any[], margin: any, chartWidth: number, chartHeight: number): string {
    const maxValue = Math.max(...data.map(d => d.value || 0));
    const minValue = Math.min(...data.map(d => d.value || 0));
    const valueRange = maxValue - minValue;
    
    let points = '';
    let path = '';
    
    data.forEach((item, i) => {
      const value = item.value || 0;
      const x = margin.left + (i / (data.length - 1)) * chartWidth;
      const y = margin.top + chartHeight - ((value - minValue) / valueRange) * chartHeight;
      
      points += `<circle cx="${x}" cy="${y}" r="4" class="fill-blue-500"><title>${item.name || `Point ${i + 1}`}: ${value}</title></circle>`;
      
      if (i === 0) {
        path += `M ${x} ${y}`;
      } else {
        path += ` L ${x} ${y}`;
      }
    });
    
    return `
      <g>
        <path d="${path}" fill="none" stroke="rgb(59, 130, 246)" stroke-width="2"></path>
        ${points}
        <line x1="${margin.left}" y1="${margin.top}" x2="${margin.left}" y2="${margin.top + chartHeight}" 
              class="stroke-gray-400" stroke-width="2"></line>
        <line x1="${margin.left}" y1="${margin.top + chartHeight}" x2="${margin.left + chartWidth}" y2="${margin.top + chartHeight}" 
              class="stroke-gray-400" stroke-width="2"></line>
      </g>
    `;
  }
  
  private createPieChart(data: any[], width: number, height: number): string {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    const total = data.reduce((sum, item) => sum + (item.value || 0), 0);
    let currentAngle = 0;
    let slices = '';
    
    const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#06B6D4'];
    
    data.forEach((item, i) => {
      const value = item.value || 0;
      const angle = (value / total) * 2 * Math.PI;
      const endAngle = currentAngle + angle;
      
      const x1 = centerX + radius * Math.cos(currentAngle);
      const y1 = centerY + radius * Math.sin(currentAngle);
      const x2 = centerX + radius * Math.cos(endAngle);
      const y2 = centerY + radius * Math.sin(endAngle);
      
      const largeArcFlag = angle > Math.PI ? 1 : 0;
      
      slices += `
        <path d="M ${centerX} ${centerY} L ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} Z"
              fill="${colors[i % colors.length]}" stroke="white" stroke-width="2">
          <title>${item.name || `Slice ${i + 1}`}: ${value} (${Math.round((value / total) * 100)}%)</title>
        </path>
      `;
      
      currentAngle = endAngle;
    });
    
    return slices;
  }
  
  save(): ChartData {
    return {
      data: this.data.data,
      chartType: this.data.chartType,
      title: this.data.title,
      width: this.data.width,
      height: this.data.height,
    };
  }
  
  validate(savedData: ChartData): boolean {
    return savedData.data !== undefined && savedData.chartType !== undefined;
  }
}

export default ChartTool;