import { useEffect, useRef, useMemo } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import 'swagger-ui-dist/swagger-ui.css';

const getSwaggerUrl = () => {
  return '/api-docs.json';
};

export default function SwaggerDocs() {
  const containerRef = useRef<HTMLDivElement>(null);
  const swaggerUrl = useMemo(() => getSwaggerUrl(), []);

  useEffect(() => {
    const initSwagger = async () => {
      const { SwaggerUIBundle } = await import('swagger-ui-dist');
      if (containerRef.current) {
        SwaggerUIBundle({
          url: swaggerUrl,
          domNode: containerRef.current,
          docExpansion: 'list',
          defaultModelsExpandDepth: -1,
        });
      }
    };
    initSwagger();
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [swaggerUrl]);

  return (
    <DashboardLayout>
      <div className="swagger-docs-container">
        <div ref={containerRef} />
      </div>
      <style>{`
        .swagger-docs-container {
          background: var(--background);
          min-height: 100%;
        }
        .swagger-docs-container .swagger-ui {
          font-family: inherit;
        }
        .swagger-docs-container .swagger-ui .topbar {
          display: none;
        }
        .swagger-docs-container .swagger-ui .info {
          margin: 20px 0;
        }
        .swagger-docs-container .swagger-ui .scheme-container {
          background: transparent;
          box-shadow: none;
          padding: 0;
        }
        /* Dark mode */
        .dark .swagger-docs-container .swagger-ui,
        .dark .swagger-docs-container .swagger-ui .info .title,
        .dark .swagger-docs-container .swagger-ui .info .base-url,
        .dark .swagger-docs-container .swagger-ui .opblock-tag,
        .dark .swagger-docs-container .swagger-ui .opblock .opblock-summary-operation-id,
        .dark .swagger-docs-container .swagger-ui .opblock .opblock-summary-path,
        .dark .swagger-docs-container .swagger-ui .opblock .opblock-summary-description,
        .dark .swagger-docs-container .swagger-ui table thead tr th,
        .dark .swagger-docs-container .swagger-ui table tbody tr td,
        .dark .swagger-docs-container .swagger-ui .parameter__name,
        .dark .swagger-docs-container .swagger-ui .parameter__type,
        .dark .swagger-docs-container .swagger-ui .response-col_status,
        .dark .swagger-docs-container .swagger-ui .response-col_description,
        .dark .swagger-docs-container .swagger-ui .model-title,
        .dark .swagger-docs-container .swagger-ui .model {
          color: hsl(var(--foreground));
        }
        .dark .swagger-docs-container .swagger-ui .opblock-body pre,
        .dark .swagger-docs-container .swagger-ui .highlight-code {
          background: hsl(var(--muted));
        }
        .dark .swagger-docs-container .swagger-ui select,
        .dark .swagger-docs-container .swagger-ui input[type="text"],
        .dark .swagger-docs-container .swagger-ui textarea {
          background: hsl(var(--background));
          color: hsl(var(--foreground));
          border-color: hsl(var(--border));
        }
        .dark .swagger-docs-container .swagger-ui .btn {
          color: hsl(var(--foreground));
          border-color: hsl(var(--border));
        }
        .dark .swagger-docs-container .swagger-ui section.models {
          border-color: hsl(var(--border));
        }
        .dark .swagger-docs-container .swagger-ui section.models .model-container {
          background: hsl(var(--muted));
        }
      `}</style>
    </DashboardLayout>
  );
}
