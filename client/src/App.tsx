import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import Start from "./pages/Start";
import NotFound from "./pages/NotFound";

const Home = lazy(() => import("./pages/Home"));
const SeriesPage = lazy(() => import("./pages/SeriesPage"));

export default function App() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div role="status" style={{ padding: 28, color: "#5b3926" }}>
            載入中…
          </div>
        }
      >
        <Switch>
          <Route path="/" component={Start} />
          <Route path="/diy" component={Home} />
          <Route path="/series/:series">
            {params => <SeriesPage seriesId={params.series} />}
          </Route>
          <Route component={NotFound} />
        </Switch>
      </Suspense>
    </ErrorBoundary>
  );
}
