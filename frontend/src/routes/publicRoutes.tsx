import { lazy } from "react";
import { Route } from "react-router-dom";
import {
  loadRoot,
  loadHomePage,
  loadNotableAlumni,
  loadAlumniStories,
  loadGivingStories,
  loadCampusNews,
  loadClubsPage,
  loadIndustriesPage,
  loadRecentGradsPage,
  loadLearningPage,
  loadCareerPage,
  loadAlumniDirectoryHome,
  loadGivingHome,
  loadAttendAnEvent,
  loadEventsHome,
  loadExploreCommunities,
  loadAboutPage,
  loadAlumniMapPage,
} from "./loaders";

const Root = lazy(loadRoot);
const HomePage = lazy(loadHomePage);
const NotableAlumni = lazy(loadNotableAlumni);
const AlumniStories = lazy(loadAlumniStories);
const GivingStories = lazy(loadGivingStories);
const CampusNews = lazy(loadCampusNews);
const ClubsPage = lazy(loadClubsPage);
const IndustriesPage = lazy(loadIndustriesPage);
const RecentGradsPage = lazy(loadRecentGradsPage);
const LearningPage = lazy(loadLearningPage);
const CareerPage = lazy(loadCareerPage);
const AlumniDirectoryHome = lazy(loadAlumniDirectoryHome);
const GivingHome = lazy(loadGivingHome);
const AttendAnEvent = lazy(loadAttendAnEvent);
const EventsHome = lazy(loadEventsHome);
const ExploreCommunities = lazy(loadExploreCommunities);
const AboutPage = lazy(loadAboutPage);
const AlumniMapPage = lazy(loadAlumniMapPage);

export function PublicRoutes() {
  return (
    <Route path="/" element={<Root />}>
      <Route index element={<HomePage />} />
      <Route path="/stories/notable-alumni" element={<NotableAlumni />} />
      <Route path="/stories/alumni-stories" element={<AlumniStories />} />
      <Route path="/stories/giving-stories" element={<GivingStories />} />
      <Route path="/stories/campus-news" element={<CampusNews />} />
      <Route path="/communities/clubs" element={<ClubsPage />} />
      <Route path="/communities/industries" element={<IndustriesPage />} />
      <Route path="/communities/recent-grads" element={<RecentGradsPage />} />
      <Route path="/benefits/learning" element={<LearningPage />} />
      <Route path="/benefits/career" element={<CareerPage />} />
      <Route path="/benefits/alumni-directory" element={<AlumniDirectoryHome />} />
      <Route path="/giving" element={<GivingHome />} />
      <Route path="/events" element={<EventsHome />} />
      <Route path="/events/attend" element={<AttendAnEvent />} />
      <Route path="/communities/explore" element={<ExploreCommunities />} />
      <Route path="/about" element={<AboutPage />} />
      <Route path="/map" element={<AlumniMapPage />} />
    </Route>
  );
}
