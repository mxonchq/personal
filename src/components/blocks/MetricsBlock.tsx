import { MetricEntry, MetricsBlock as MetricsBlockType } from '../../types';
import { BlockCard } from './BlockCard';
import './MetricsBlock.css';

interface Props {
  block: MetricsBlockType;
  onChange: (block: MetricsBlockType) => void;
}

export function MetricsBlock({ block, onChange }: Props) {
  const updateMetric = (entry: MetricEntry) => {
    const metrics = block.metrics.map((item) => (item.id === entry.id ? entry : item));
    onChange({ ...block, metrics });
  };

  return (
    <BlockCard title="Метрики">
      <div className="metrics-grid">
        {block.metrics.map((metric) => (
          <div key={metric.id} className="metric-row">
            <input
              className="metric-row__label"
              value={metric.label}
              onChange={(event) => updateMetric({ ...metric, label: event.target.value })}
            />
            <input
              className="metric-row__value"
              value={metric.value}
              onChange={(event) => updateMetric({ ...metric, value: event.target.value })}
            />
          </div>
        ))}
      </div>
    </BlockCard>
  );
}
