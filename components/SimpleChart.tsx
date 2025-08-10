
import React, { useRef, useEffect } from 'react';
import { ChartData } from '../types';

interface SimpleChartProps {
  chartData: ChartData;
}

const SimpleChart: React.FC<SimpleChartProps> = ({ chartData }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current || !chartData) return;

    // More robust guard clause
    if (!chartData.data || !Array.isArray(chartData.data.labels) || !Array.isArray(chartData.data.datasets)) {
        console.warn("SimpleChart: chartData.data or its properties are invalid. Skipping render.", chartData);
        return;
    }

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { labels, datasets } = chartData.data;
    const chartType = chartData.chartType;

    const devicePixelRatio = window.devicePixelRatio || 1;
    canvas.width = canvas.offsetWidth * devicePixelRatio;
    canvas.height = canvas.offsetHeight * devicePixelRatio;
    ctx.scale(devicePixelRatio, devicePixelRatio);

    const padding = 40;
    const chartWidth = canvas.offsetWidth - 2 * padding;
    const chartHeight = canvas.offsetHeight - 2 * padding;
    
    let maxValue = 0;
    const allDataPoints = datasets.flatMap(ds => ds.data || []);
    if (allDataPoints.length > 0) {
        maxValue = Math.max(...allDataPoints);
    }
    if (maxValue === 0) maxValue = 100; // Avoid division by zero


    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Y-axis labels and grid lines
    ctx.beginPath();
    ctx.strokeStyle = '#4b5563'; // gray-600
    ctx.fillStyle = '#9ca3af'; // gray-400
    ctx.font = '10px sans-serif';
    ctx.textAlign = 'right';
    for (let i = 0; i <= 5; i++) {
        const value = (maxValue / 5) * i;
        const y = chartHeight + padding - (value / maxValue) * chartHeight;
        ctx.fillText(value.toLocaleString(), padding - 8, y + 3);
        ctx.moveTo(padding, y);
        ctx.lineTo(chartWidth + padding, y);
    }
    ctx.stroke();

    // Draw X-axis labels
    ctx.textAlign = 'center';
    labels.forEach((label, i) => {
        const x = padding + (i + 0.5) * (chartWidth / labels.length);
        ctx.fillText(label, x, chartHeight + padding + 15);
    });

    // Draw data
    if (chartType === 'bar') {
        const barWidth = (chartWidth / labels.length) * 0.6 / datasets.length;
        datasets.forEach((dataset, setIndex) => {
            ctx.fillStyle = dataset.color || '#38bdf8';
            (dataset.data || []).forEach((value, i) => {
                const barHeight = (value / maxValue) * chartHeight;
                const x = padding + (i + 0.5) * (chartWidth / labels.length) - (barWidth * datasets.length / 2) + (setIndex * barWidth);
                const y = chartHeight + padding - barHeight;
                ctx.fillRect(x, y, barWidth, barHeight);
            });
        });
    } else if (chartType === 'line') {
         datasets.forEach(dataset => {
            ctx.strokeStyle = dataset.color || '#38bdf8';
            ctx.lineWidth = 2;
            ctx.beginPath();
            (dataset.data || []).forEach((value, i) => {
                const x = padding + (i + 0.5) * (chartWidth / labels.length);
                const y = chartHeight + padding - (value / maxValue) * chartHeight;
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.stroke();
            
            // Draw points
            ctx.fillStyle = dataset.color || '#38bdf8';
            (dataset.data || []).forEach((value, i) => {
                 const x = padding + (i + 0.5) * (chartWidth / labels.length);
                 const y = chartHeight + padding - (value / maxValue) * chartHeight;
                 ctx.beginPath();
                 ctx.arc(x, y, 3, 0, 2 * Math.PI);
                 ctx.fill();
            });
        });
    }

  }, [chartData]);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '200px' }}></canvas>;
};

export default SimpleChart;
