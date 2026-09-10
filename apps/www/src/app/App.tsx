import { Route, Routes } from 'react-router-dom';
import { PublicLayout } from './layout/PublicLayout';
import { HomePage } from './pages/HomePage';
import { SearchPage } from './pages/SearchPage';
import { TechnologyDetailPage } from './pages/TechnologyDetailPage';
import { OrganizationPage } from './pages/OrganizationPage';
import { ChallengeDetailPage } from './pages/ChallengeDetailPage';
import { ProjectDetailPage } from './pages/ProjectDetailPage';
import { FundingPage } from './pages/FundingPage';
import { FundingOfferDetailPage } from './pages/FundingOfferDetailPage';
import { CaseDetailPage, CasesPage } from './pages/CasesPages';
import { PublishChallengeLandingPage, PublishOfferLandingPage } from './pages/SectionPages';

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route index element={<HomePage />} />
        <Route path="search" element={<SearchPage />} />
        <Route path="funding" element={<FundingPage />} />
        <Route path="funding/:slug" element={<FundingOfferDetailPage />} />
        <Route path="challenge" element={<PublishChallengeLandingPage />} />
        <Route path="offer" element={<PublishOfferLandingPage />} />
        <Route path="cases" element={<CasesPage />} />
        <Route path="cases/:slug" element={<CaseDetailPage />} />
        <Route path="solutions/:slug" element={<TechnologyDetailPage />} />
        <Route path="organizations/:slug" element={<OrganizationPage />} />
        <Route path="challenges/:slug" element={<ChallengeDetailPage />} />
        <Route path="projects/:slug" element={<ProjectDetailPage />} />
      </Route>
    </Routes>
  );
}
