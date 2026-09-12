import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { FilterPillSelect } from "@/components/ui/FilterPillSelect";
import { FilterPillCombobox } from "@/components/ui/FilterPillCombobox";
import {
  SegmentedToggle,
  SegmentedToggleOption,
} from "@/components/ui/SegmentedToggle";
import {
  GraduationCap,
  Search,
  Filter,
  ChevronDown,
  X,
  Loader2,
  Users,
  UsersRound,
} from "lucide-react";
import { useAlumniDirectory } from "@/hooks/useAlumniDirectory";
import { useResponsivePagination } from "@/hooks/useResponsivePagination";
import { AlumniCard } from "@/components/alumni/AlumniCard";
import { AlumniCardSkeleton } from "@/components/alumni/AlumniCardSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { SmartPagination } from "@/components/ui/pagination";
import { BRANCHES, CAMPUSES } from "@/constants/branches";
import UserAvatar from "@/components/UserAvatar";
import { MyConnectionsPanel } from "@/components/connections/MyConnectionsPanel";
import { cn } from "@/lib/utils";

// Most recent grad years first — covers next year's incoming students down
// through six decades of alumni.
const CURRENT_YEAR = new Date().getFullYear();
const CLASS_YEARS = Array.from({ length: 61 }, (_, i) => String(CURRENT_YEAR + 1 - i));

type Tab = "all" | "my";

const TAB_OPTIONS: readonly SegmentedToggleOption<Tab>[] = [
  { value: "all", label: "All Alumni", icon: Users },
  { value: "my", label: "My Connections", icon: UsersRound },
];

const AlumniDirectory = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isSearchFocused, setIsSearchFocused] = useState(false);

  const tab: Tab = searchParams.get("tab") === "my" ? "my" : "all";
  const setTab = (next: Tab) => {
    const params = new URLSearchParams(searchParams);
    if (next === "my") params.set("tab", "my");
    else params.delete("tab");
    setSearchParams(params, { replace: true });
  };

  // Whether the "Advanced" panel is expanded inline below the filter pills.
  const [advancedOpen, setAdvancedOpen] = useState(false);

  // Matches the hook's own page size so the loading skeleton holds the same
  // footprint as a full page of results instead of shrinking mid-search.
  const itemsPerPage = useResponsivePagination();

  const {
    alumni,
    isLoading,
    hasSearched,
    currentPage,
    totalPages,
    filters,
    skillInput,
    showClearButton,
    setSkillInput,
    handleFilterChange,
    handleAddSkill,
    handleRemoveSkill,
    handleSearch,
    handleClearResults,
    handlePageChange,
    handleConnect,
    getFilteredAlumni,
  } = useAlumniDirectory();

  // Only the fields tucked inside the advanced panel count toward its badge —
  // Class Year / Branch / Campus / Connections / User Type are always-visible
  // pills with their own clear button.
  const advancedFilterCount = [
    filters.company,
    filters.city,
    filters.country,
    filters.skills.length > 0,
  ].filter(Boolean).length;

  const handleClearAdvancedFilters = () => {
    handleFilterChange("company", "");
    handleFilterChange("city", "");
    handleFilterChange("country", "");
    handleFilterChange("skills", []);
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-foreground">
      {/* Main Content */}
      <div className="container mx-auto">
        <div className="max-w-7xl mx-auto">

          {/* Header */}
          <div className="mb-8 flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-headline-xl text-primary mb-2">
                {tab === "my" ? "My Connections" : "Alumni Directory"}
              </h2>
              <p className="text-body-lg text-muted-foreground">
                {tab === "my"
                  ? "Manage the people you're connected with and pending requests."
                  : "Connect with fellow NSUT alumni from across batches and branches"}
              </p>
            </div>

            <SegmentedToggle
              label="Directory view"
              value={tab}
              onChange={setTab}
              options={TAB_OPTIONS}
            />
          </div>

          {tab === "my" ? (
            <MyConnectionsPanel />
          ) : (
            <>
              {/* Search and Filter Section */}
              <div className="mb-8">
                <div className="space-y-3">
                  {/* Top Row: Search Bar */}
                  <div className="flex gap-2">
                    <div className="flex-1 relative rounded-card border border-border bg-card shadow-card group focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/20 transition-all">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                      <Input
                        placeholder="Search by name..."
                        value={filters.name}
                        onChange={(e) =>
                          handleFilterChange("name", e.target.value)
                        }
                        onKeyPress={(e) => {
                          if (e.key === "Enter") handleSearch();
                        }}
                        onFocus={() => setIsSearchFocused(true)}
                        onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
                        className="h-11 border-none bg-transparent pl-10 pr-3 text-body-md text-foreground placeholder:text-muted-foreground shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
                      />

                      {/* Mobile Search Dropdown */}
                      {isSearchFocused && filters.name && (
                        <div className="md:hidden absolute top-full mt-2 left-0 right-0 bg-popover border border-border rounded-xl shadow-lg z-50 overflow-hidden max-h-80 overflow-y-auto">
                          {isLoading ? (
                            <div className="p-4 flex items-center justify-center text-muted-foreground">
                              <Loader2 className="h-5 w-5 animate-spin mr-2" />
                              Searching...
                            </div>
                          ) : alumni.length > 0 ? (
                            <div className="py-2">
                              {alumni.slice(0, 5).map((profile) => (
                                <div
                                  key={profile._id}
                                  onClick={() => navigate(`/dashboard/alumni/${profile.user._id}`)}
                                  className="flex items-center gap-3 px-4 py-3 hover:bg-accent cursor-pointer transition-colors"
                                >
                                  <UserAvatar
                                    src={profile.profile_picture}
                                    name={profile.user.name}
                                    size="sm"
                                  />
                                  <div className="min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">
                                      {profile.user.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                      {profile.batch} • {profile.branch}
                                    </p>
                                  </div>
                                </div>
                              ))}
                              <div
                                onClick={() => {
                                  setIsSearchFocused(false);
                                }}
                                className="px-4 py-2 text-center text-xs text-primary font-medium cursor-pointer border-t border-border hover:bg-accent"
                              >
                                View all {alumni.length} results
                              </div>
                            </div>
                          ) : hasSearched ? (
                            <div className="p-4 text-center text-muted-foreground text-sm">
                              No alumni found matching "{filters.name}"
                            </div>
                          ) : null}
                        </div>
                      )}
                    </div>

                    {showClearButton ? (
                      <Button
                        onClick={handleClearResults}
                        variant="outline"
                        size="icon"
                        className="border-destructive/30 text-destructive hover:bg-destructive/10 hover:text-destructive bg-transparent shrink-0 w-11 h-11 rounded-card"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        onClick={handleSearch}
                        size="icon"
                        className="bg-primary hover:bg-primary-hover text-primary-foreground shrink-0 w-11 h-11 rounded-card"
                      >
                        <Search className="h-4 w-4" />
                      </Button>
                    )}
                  </div>

                  {/* Second Row: Filter Pills & Advanced Toggle */}
                  <div className="flex flex-wrap items-center gap-2">
                    <FilterPillCombobox
                      value={filters.batch}
                      onValueChange={(value) => handleFilterChange("batch", value)}
                      onClear={() => handleFilterChange("batch", "")}
                      placeholder="Class Year"
                      searchPlaceholder="Search year..."
                      options={CLASS_YEARS}
                      className="w-[45%] sm:w-auto"
                      triggerClassName="w-full sm:w-32"
                    />

                    <FilterPillCombobox
                      value={filters.branch}
                      onValueChange={(value) => handleFilterChange("branch", value)}
                      onClear={() => handleFilterChange("branch", "")}
                      placeholder="All Branches"
                      searchPlaceholder="Search branch..."
                      options={BRANCHES}
                      className="w-[45%] sm:w-auto"
                      triggerClassName="w-full sm:w-52"
                    />

                    <FilterPillSelect
                      value={filters.connectionFilter === "all" ? "" : filters.connectionFilter}
                      onValueChange={(value) => handleFilterChange("connectionFilter", value)}
                      onClear={() => handleFilterChange("connectionFilter", "all")}
                      placeholder="Connections"
                      options={["connected", "not_connected"]}
                      labels={{ connected: "Connected", not_connected: "Not Connected" }}
                      className="w-[45%] sm:w-auto"
                      triggerClassName="w-full sm:w-40"
                    />

                    <FilterPillSelect
                      value={filters.roleFilter === "all" ? "" : filters.roleFilter}
                      onValueChange={(value) => handleFilterChange("roleFilter", value)}
                      onClear={() => handleFilterChange("roleFilter", "all")}
                      placeholder="User Type"
                      options={["alumni", "student", "faculty"]}
                      labels={{ alumni: "Alumni", student: "Students", faculty: "Faculty" }}
                      className="w-[45%] sm:w-auto"
                      triggerClassName="w-full sm:w-36"
                    />

                    <div className="flex-1" />

                    {/* Advanced toggle — extends this section inline instead of opening a modal */}
                    <Button
                      variant="ghost"
                      onClick={() => setAdvancedOpen((open) => !open)}
                      aria-expanded={advancedOpen}
                      className="text-primary hover:bg-primary/10 hover:text-primary h-10 relative rounded-full text-label-md"
                    >
                      <Filter className="h-4 w-4 mr-1.5" />
                      Advanced
                      {advancedFilterCount > 0 && (
                        <Badge variant="secondary" className="ml-2 bg-primary text-primary-foreground hover:bg-primary px-1.5 py-0 min-w-[20px] flex items-center justify-center rounded-full">
                          {advancedFilterCount}
                        </Badge>
                      )}
                      <ChevronDown
                        className={cn(
                          "h-4 w-4 ml-1 transition-transform duration-200",
                          advancedOpen && "rotate-180"
                        )}
                      />
                    </Button>
                  </div>

                  {/* Advanced Panel — extends the filter section in place */}
                  {advancedOpen && (
                    <div className="rounded-card border border-border bg-card p-4 md:p-6 space-y-6 animate-in fade-in slide-in-from-top-2 duration-200">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        {/* Company Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="company" className="text-foreground">
                            Company
                          </Label>
                          <Input
                            id="company"
                            placeholder="Search by company..."
                            value={filters.company}
                            onChange={(e) =>
                              handleFilterChange("company", e.target.value)
                            }
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                        </div>

                        {/* City Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="city" className="text-foreground">
                            City
                          </Label>
                          <Input
                            id="city"
                            placeholder="Search by city..."
                            value={filters.city}
                            onChange={(e) =>
                              handleFilterChange("city", e.target.value)
                            }
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                        </div>

                        {/* Country Filter */}
                        <div className="space-y-2">
                          <Label htmlFor="country" className="text-foreground">
                            Country
                          </Label>
                          <Input
                            id="country"
                            placeholder="Search by country..."
                            value={filters.country}
                            onChange={(e) =>
                              handleFilterChange("country", e.target.value)
                            }
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                        </div>

                        {/* Campus Filter */}
                        <div className="space-y-2">
                          <Label className="text-foreground">
                            Campus
                          </Label>
                          <FilterPillSelect
                            value={filters.campus}
                            onValueChange={(value) => handleFilterChange("campus", value)}
                            onClear={() => handleFilterChange("campus", "")}
                            placeholder="All Campuses"
                            options={CAMPUSES}
                            className="w-full"
                            triggerClassName="w-full h-10 border-input bg-background rounded-md px-3"
                          />
                        </div>
                      </div>

                      {/* Skills Filter */}
                      <div className="space-y-2">
                        <Label htmlFor="skills" className="text-foreground">
                          Skills
                        </Label>
                        <div className="flex gap-2">
                          <Input
                            id="skills"
                            placeholder="Add skill to filter"
                            value={skillInput}
                            onChange={(e) => setSkillInput(e.target.value)}
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleAddSkill();
                              }
                            }}
                            className="bg-background border-input text-foreground placeholder:text-muted-foreground focus:border-ring focus:ring-ring"
                          />
                          <Button
                            type="button"
                            onClick={handleAddSkill}
                            variant="outline"
                            className="border-border bg-background text-foreground hover:bg-accent hover:text-accent-foreground"
                          >
                            Add
                          </Button>
                        </div>
                        {filters.skills.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {filters.skills.map((skill, index) => (
                              <Badge
                                key={index}
                                variant="secondary"
                                className="gap-1 cursor-pointer bg-accent text-foreground hover:bg-accent/80 border border-border"
                                onClick={() => handleRemoveSkill(skill)}
                              >
                                {skill}
                                <X className="h-3 w-3" />
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-2 border-t border-border">
                        <Button
                          variant="ghost"
                          onClick={handleClearAdvancedFilters}
                          className="text-muted-foreground hover:text-foreground"
                        >
                          Clear Advanced Filters
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Results */}
              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-fr">
                  {Array.from({ length: Math.max(alumni.length, itemsPerPage) }).map((_, i) => (
                    <AlumniCardSkeleton key={i} />
                  ))}
                </div>
              ) : !hasSearched ? (
                <EmptyState
                  icon={
                    <GraduationCap className="h-20 w-20 text-primary/30 mx-auto" />
                  }
                  title="Ready to Connect? 🎓"
                  description="Use the search bar and filters above to find alumni"
                />
              ) : alumni.length === 0 ? (
                <EmptyState
                  icon={<Search className="h-12 w-12 text-muted-foreground mx-auto" />}
                  title="No Results Found"
                  description="We couldn't find any alumni matching your search."
                  action={
                    <Button
                      onClick={handleClearResults}
                      variant="outline"
                      className="mt-4 bg-background text-foreground border-border hover:bg-accent hover:text-foreground"
                    >
                      Clear Search
                    </Button>
                  }
                />
              ) : (
                <>
                  {(() => {
                    const filteredAlumni = getFilteredAlumni();

                    return (
                      <>
                        {filteredAlumni.length === 0 ? (
                          <EmptyState
                            icon="🔍"
                            title="No Results Found"
                            description="No alumni match your selected filters"
                            action={
                              <Button
                                onClick={handleClearResults}
                                variant="outline"
                                className="border-primary/50 text-primary hover:bg-primary/10 hover:text-primary bg-transparent"
                              >
                                Clear All Filters
                              </Button>
                            }
                          />
                        ) : (
                          <>
                            {/* Alumni Grid */}
                            {/* Keyed on the page so paging re-runs the
                                cascade rather than swapping cards silently. */}
                            <div
                              key={currentPage}
                              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8 auto-rows-fr"
                            >
                              {filteredAlumni.map((alumnus, index) => (
                                <AlumniCard
                                  key={alumnus._id}
                                  alumni={alumnus}
                                  index={index}
                                  onConnect={handleConnect}
                                  onClick={() =>
                                    navigate(
                                      `/dashboard/alumni/${alumnus.user._id}`
                                    )
                                  }
                                />
                              ))}
                            </div>

                            {/* Pagination */}
                            <div className="pb-24 md:pb-0">
                              <SmartPagination
                                currentPage={currentPage}
                                totalPages={totalPages}
                                onPageChange={handlePageChange}
                              />
                            </div>
                          </>
                        )}
                      </>
                    );
                  })()}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AlumniDirectory;
