import { Component, type ReactNode, useEffect, useMemo, useRef } from "react";
import { Route, Router, Switch, useLocation } from "wouter";
import { memoryLocation } from "wouter/memory-location";
import { SERIES } from "../configurator/model";
import Home from "../pages/Home";
import SeriesPage from "../pages/SeriesPage";
import Start from "../pages/Start";

const seriesIds = new Set<string>(SERIES.map(series => series.id));

class EmbedErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{ padding: "24px", color: "#5b3926", background: "#fff" }}
        >
          載入失敗，請重新整理後再試。
        </div>
      );
    }

    return this.props.children;
  }
}

function EmbedRoutes() {
  const [location] = useLocation();
  const viewRef = useRef<HTMLDivElement>(null);
  const isInitialRoute = useRef(true);

  useEffect(() => {
    if (isInitialRoute.current) {
      isInitialRoute.current = false;
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      viewRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location]);

  return (
    <div ref={viewRef} data-myu-embed-view>
      <Switch>
        <Route path="/diy" component={Home} />
        <Route path="/series/:series">
          {params =>
            seriesIds.has(params.series) ? (
              <SeriesPage seriesId={params.series} />
            ) : (
              <Start />
            )
          }
        </Route>
        <Route path="/" component={Start} />
        <Route path="*" component={Start} />
      </Switch>
    </div>
  );
}

/**
 * Export-only app shell. Navigation stays inside this component instance,
 * including opaque preview iframes and themes that rewrite URL fragments.
 */
export default function EmbedApp() {
  const router = useMemo(() => memoryLocation({ path: "/" }), []);
  return (
    <EmbedErrorBoundary>
      <Router hook={router.hook} searchHook={router.searchHook}>
        <EmbedRoutes />
      </Router>
    </EmbedErrorBoundary>
  );
}
