import { useEffect, useState } from "react";
import AdminLayout from "../../components/admin/AdminLayout";
import { Event, getAllEvents, addEventGalleryPhotos, removeEventGalleryPhoto } from "../../lib/adminApi";
import { Calendar as CalendarIcon, Edit, Trash2, RefreshCw, Search, Filter, Image as ImageIcon, X, Upload } from "lucide-react";
import api from "../../lib/api";
import { BASE_URL } from "../../lib/constants";
import { Button } from "../../components/ui/button";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Textarea } from "../../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../../components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "../../components/ui/dialog";

const CurrentEvents = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  
  // Edit Dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [editFormData, setEditFormData] = useState({
    title: "",
    description: "",
    event_date: "",
    event_time: "",
    location: "",
    event_type: "",
    registration_link: "",
    max_participants: "",
    contact_email: "",
    contact_phone: "",
    contact_website: "",
    creator_name: "",
    creator_email: "",
    status: "",
    recap: "",
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [updating, setUpdating] = useState(false);

  // Gallery management (recap photos for completed/upcoming events)
  const [galleryPhotos, setGalleryPhotos] = useState<string[]>([]);
  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);
  const [uploadingGallery, setUploadingGallery] = useState(false);
  const [removingPhoto, setRemovingPhoto] = useState<string | null>(null);
  
  // Delete Dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<Event | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Reason Dialog
  const [reasonDialogOpen, setReasonDialogOpen] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>("");

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, statusFilter, typeFilter]);

  const fetchEvents = async () => {
    setIsLoading(true);
    try {
      const response = await getAllEvents({ page: 1, limit: 100 });
      if (response.success) {
        setEvents(response.data);
      }
    } catch (err) {
      console.error("Failed to fetch events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = [...events];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.creator_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => event.status === statusFilter);
    }

    // Filter by type
    if (typeFilter !== "all") {
      filtered = filtered.filter((event) => event.event_type === typeFilter);
    }

    setFilteredEvents(filtered);
  };

  const handleEditClick = (event: Event) => {
    setSelectedEvent(event);
    setEditFormData({
      title: event.title,
      description: event.description,
      event_date: event.event_date.split("T")[0],
      event_time: event.event_time,
      location: event.location,
      event_type: event.event_type,
      registration_link: event.registration_link || "",
      max_participants: event.max_participants?.toString() || "",
      contact_email: event.contact_info?.email || "",
      contact_phone: event.contact_info?.phone || "",
      contact_website: event.contact_info?.website || "",
      creator_name: event.creator_name,
      creator_email: event.creator_email,
      status: event.status,
      recap: event.recap || "",
    });
    if (event.image_url) {
      setImagePreview(`${BASE_URL}${event.image_url}`);
    }
    setGalleryPhotos(event.gallery || []);
    setNewGalleryFiles([]);
    setNewGalleryPreviews([]);
    setEditDialogOpen(true);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleUpdateEvent = async () => {
    if (!selectedEvent) return;

    setUpdating(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("title", editFormData.title);
      formDataToSend.append("description", editFormData.description);
      formDataToSend.append("event_date", editFormData.event_date);
      formDataToSend.append("event_time", editFormData.event_time);
      formDataToSend.append("location", editFormData.location);
      formDataToSend.append("event_type", editFormData.event_type);
      formDataToSend.append("registration_link", editFormData.registration_link);
      formDataToSend.append("status", editFormData.status);
      formDataToSend.append("recap", editFormData.recap);
      
      if (editFormData.max_participants) {
        formDataToSend.append("max_participants", editFormData.max_participants);
      }

      formDataToSend.append("contact_info", JSON.stringify({
        phone: editFormData.contact_phone,
        email: editFormData.contact_email,
        website: editFormData.contact_website,
      }));

      formDataToSend.append("creator_name", editFormData.creator_name);
      formDataToSend.append("creator_email", editFormData.creator_email);

      if (imageFile) {
        formDataToSend.append("event_image", imageFile);
      }

      await api.put(`/admin/events/update/${selectedEvent._id}`, formDataToSend, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      alert("Event updated successfully!");
      setEditDialogOpen(false);
      setSelectedEvent(null);
      setImageFile(null);
      setImagePreview("");
      fetchEvents();
    } catch (err) {
      console.error("Failed to update event:", err);
      alert("Failed to update event");
    } finally {
      setUpdating(false);
    }
  };

  const handleGalleryFilesSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setNewGalleryFiles((prev) => [...prev, ...files]);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewGalleryPreviews((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
    // Reset the input so selecting the same file again re-triggers onChange
    e.target.value = "";
  };

  const handleRemoveStagedFile = (index: number) => {
    setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
    setNewGalleryPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUploadGalleryPhotos = async () => {
    if (!selectedEvent || newGalleryFiles.length === 0) return;

    setUploadingGallery(true);
    try {
      const response = await addEventGalleryPhotos(selectedEvent._id, newGalleryFiles);
      if (response.success) {
        setGalleryPhotos(response.data.gallery || []);
        setNewGalleryFiles([]);
        setNewGalleryPreviews([]);
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to upload gallery photos:", err);
      alert("Failed to upload gallery photos");
    } finally {
      setUploadingGallery(false);
    }
  };

  const handleRemoveGalleryPhoto = async (photoUrl: string) => {
    if (!selectedEvent) return;
    if (!window.confirm("Remove this photo from the gallery?")) return;

    setRemovingPhoto(photoUrl);
    try {
      const response = await removeEventGalleryPhoto(selectedEvent._id, photoUrl);
      if (response.success) {
        setGalleryPhotos(response.data.gallery || []);
        fetchEvents();
      }
    } catch (err) {
      console.error("Failed to remove gallery photo:", err);
      alert("Failed to remove gallery photo");
    } finally {
      setRemovingPhoto(null);
    }
  };

  const handleDeleteClick = (event: Event) => {
    setEventToDelete(event);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!eventToDelete) return;

    setDeleting(true);
    try {
      await api.delete(`/admin/events/delete/${eventToDelete._id}`);
      alert("Event deleted successfully!");
      setDeleteDialogOpen(false);
      setEventToDelete(null);
      fetchEvents();
    } catch (err) {
      console.error("Failed to delete event:", err);
      alert("Failed to delete event");
    } finally {
      setDeleting(false);
    }
  };

  const handleShowReason = (reason: string) => {
    setSelectedReason(reason);
    setReasonDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: "bg-yellow-500/20 text-yellow-600 border-yellow-500/30",
      approved: "bg-green-500/20 text-green-600 border-green-500/30",
      rejected: "bg-red-500/20 text-red-600 border-red-500/30",
    };
    return badges[status as keyof typeof badges] || badges.pending;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Current Events</h1>
            <p className="text-gray-600 mt-2">
              {filteredEvents.length} event{filteredEvents.length !== 1 && "s"} found
            </p>
          </div>
          <Button
            onClick={fetchEvents}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="search" className="flex items-center gap-2 mb-2">
                <Search size={16} />
                Search
              </Label>
              <Input
                id="search"
                placeholder="Search events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="status-filter" className="flex items-center gap-2 mb-2">
                <Filter size={16} />
                Status
              </Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger id="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="type-filter" className="flex items-center gap-2 mb-2">
                <Filter size={16} />
                Event Type
              </Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger id="type-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="seminar">Seminar</SelectItem>
                  <SelectItem value="conference">Conference</SelectItem>
                  <SelectItem value="meetup">Meetup</SelectItem>
                  <SelectItem value="webinar">Webinar</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Events List */}
        {isLoading ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <RefreshCw className="mx-auto text-gray-400 mb-4 animate-spin" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading events...</h3>
          </div>
        ) : filteredEvents.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
            <CalendarIcon className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-600">Try adjusting your filters</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredEvents.map((event) => (
              <div
                key={event._id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {/* Event Image */}
                  <div className="flex-shrink-0">
                    <div className="w-40 h-32 bg-gray-100 rounded-lg overflow-hidden">
                      {event.image_url ? (
                        <img
                          src={`${BASE_URL}${event.image_url}`}
                          alt={event.title}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
                          <CalendarIcon className="text-gray-400" size={32} />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="text-xl font-semibold text-gray-900">{event.title}</h3>
                        <div className="flex gap-2 mt-1">
                          <span className={`inline-block px-2 py-1 text-xs font-medium rounded-full border ${getStatusBadge(event.status)}`}>
                            {event.status}
                          </span>
                          <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full capitalize">
                            {event.event_type}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        {event.status === "rejected" && event.rejection_reason && (
                          <Button
                            onClick={() => handleShowReason(event.rejection_reason || "No reason provided")}
                            className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2"
                          >
                            Reason
                          </Button>
                        )}
                        <Button
                          onClick={() => handleEditClick(event)}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2"
                        >
                          <Edit size={16} className="mr-1" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteClick(event)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2"
                        >
                          <Trash2 size={16} className="mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{event.description}</p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500">Date:</span>{" "}
                        <span className="font-medium">
                          {new Date(event.event_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Time:</span>{" "}
                        <span className="font-medium">{event.event_time}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Host:</span>{" "}
                        <span className="font-medium">{event.creator_name}</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Likes:</span>{" "}
                        <span className="font-medium">{event.likes || 0}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit Dialog */}
        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Edit Event</DialogTitle>
              <DialogDescription>
                Update any field of this event including the host information
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 mt-4">
              {/* Title */}
              <div>
                <Label htmlFor="edit-title">Event Title *</Label>
                <Input
                  id="edit-title"
                  value={editFormData.title}
                  onChange={(e) => setEditFormData({ ...editFormData, title: e.target.value })}
                />
              </div>

              {/* Description */}
              <div>
                <Label htmlFor="edit-description">Description *</Label>
                <Textarea
                  id="edit-description"
                  value={editFormData.description}
                  onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                  className="min-h-[100px]"
                />
              </div>

              {/* Recap (shown publicly on completed events) */}
              <div>
                <Label htmlFor="edit-recap">Recap / Highlights (optional)</Label>
                <Textarea
                  id="edit-recap"
                  value={editFormData.recap}
                  onChange={(e) => setEditFormData({ ...editFormData, recap: e.target.value })}
                  placeholder="A short summary of how the event went — shown publicly once the event is completed."
                  className="min-h-[80px]"
                />
              </div>

              {/* Date and Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-date">Event Date *</Label>
                  <Input
                    id="edit-date"
                    type="date"
                    value={editFormData.event_date}
                    onChange={(e) => setEditFormData({ ...editFormData, event_date: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-time">Event Time *</Label>
                  <Input
                    id="edit-time"
                    type="time"
                    value={editFormData.event_time}
                    onChange={(e) => setEditFormData({ ...editFormData, event_time: e.target.value })}
                  />
                </div>
              </div>

              {/* Location */}
              <div>
                <Label htmlFor="edit-location">Location *</Label>
                <Input
                  id="edit-location"
                  value={editFormData.location}
                  onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
                />
              </div>

              {/* Event Type and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-type">Event Type</Label>
                  <Select
                    value={editFormData.event_type}
                    onValueChange={(value) => setEditFormData({ ...editFormData, event_type: value })}
                  >
                    <SelectTrigger id="edit-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="workshop">Workshop</SelectItem>
                      <SelectItem value="seminar">Seminar</SelectItem>
                      <SelectItem value="conference">Conference</SelectItem>
                      <SelectItem value="meetup">Meetup</SelectItem>
                      <SelectItem value="webinar">Webinar</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="edit-status">Status</Label>
                  <Select
                    value={editFormData.status}
                    onValueChange={(value) => setEditFormData({ ...editFormData, status: value })}
                  >
                    <SelectTrigger id="edit-status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="approved">Approved</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Registration Link and Max Participants */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="edit-reg-link">Registration Link</Label>
                  <Input
                    id="edit-reg-link"
                    value={editFormData.registration_link}
                    onChange={(e) => setEditFormData({ ...editFormData, registration_link: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="edit-max-part">Max Participants</Label>
                  <Input
                    id="edit-max-part"
                    type="number"
                    value={editFormData.max_participants}
                    onChange={(e) => setEditFormData({ ...editFormData, max_participants: e.target.value })}
                  />
                </div>
              </div>

              {/* Host Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Host Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="edit-creator-name">Host Name *</Label>
                    <Input
                      id="edit-creator-name"
                      value={editFormData.creator_name}
                      onChange={(e) => setEditFormData({ ...editFormData, creator_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="edit-creator-email">Host Email *</Label>
                    <Input
                      id="edit-creator-email"
                      type="email"
                      value={editFormData.creator_email}
                      onChange={(e) => setEditFormData({ ...editFormData, creator_email: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Contact Information</h4>
                <div className="space-y-3">
                  <Input
                    placeholder="Contact Email"
                    value={editFormData.contact_email}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_email: e.target.value })}
                  />
                  <Input
                    placeholder="Contact Phone"
                    value={editFormData.contact_phone}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_phone: e.target.value })}
                  />
                  <Input
                    placeholder="Contact Website"
                    value={editFormData.contact_website}
                    onChange={(e) => setEditFormData({ ...editFormData, contact_website: e.target.value })}
                  />
                </div>
              </div>

              {/* Event Image */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-3">Event Image</h4>
                {imagePreview && (
                  <div className="mb-3">
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-full h-48 object-contain rounded-lg border"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="cursor-pointer"
                />
              </div>

              {/* Gallery (recap photos) */}
              <div className="border-t pt-4">
                <h4 className="font-semibold mb-1 flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  Gallery Photos
                </h4>
                <p className="text-sm text-gray-500 mb-3">
                  Add photos to appear in this event's public gallery — great for sharing highlights after it's completed.
                </p>

                {/* Existing photos already on the event */}
                {galleryPhotos.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {galleryPhotos.map((url) => (
                      <div key={url} className="relative group">
                        <img
                          src={`${BASE_URL}${url}`}
                          alt="Gallery"
                          className="w-full h-20 object-cover rounded-md border"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveGalleryPhoto(url)}
                          disabled={removingPhoto === url}
                          className="absolute -top-1.5 -right-1.5 bg-red-600 text-white rounded-full p-1 shadow hover:bg-red-700 disabled:opacity-50"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Newly staged photos, not yet uploaded */}
                {newGalleryPreviews.length > 0 && (
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {newGalleryPreviews.map((preview, idx) => (
                      <div key={idx} className="relative group">
                        <img
                          src={preview}
                          alt="Pending upload"
                          className="w-full h-20 object-cover rounded-md border-2 border-dashed border-blue-400"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveStagedFile(idx)}
                          className="absolute -top-1.5 -right-1.5 bg-gray-700 text-white rounded-full p-1 shadow hover:bg-gray-800"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleGalleryFilesSelected}
                    className="cursor-pointer"
                  />
                  {newGalleryFiles.length > 0 && (
                    <Button
                      type="button"
                      onClick={handleUploadGalleryPhotos}
                      disabled={uploadingGallery}
                      className="bg-emerald-600 hover:bg-emerald-700 shrink-0"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      {uploadingGallery ? "Uploading..." : `Upload (${newGalleryFiles.length})`}
                    </Button>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t">
                <Button
                  type="button"
                  onClick={() => setEditDialogOpen(false)}
                  className="flex-1 bg-gray-600 hover:bg-gray-700"
                  disabled={updating}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  onClick={handleUpdateEvent}
                  disabled={updating}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {updating ? "Updating..." : "Update Event"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Rejection Reason Dialog */}
        <Dialog open={reasonDialogOpen} onOpenChange={setReasonDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejection Reason</DialogTitle>
              <DialogDescription>
                This event was rejected for the following reason:
              </DialogDescription>
            </DialogHeader>
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800">{selectedReason}</p>
            </div>
            <div className="flex justify-end mt-4">
              <Button
                onClick={() => setReasonDialogOpen(false)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Close
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Event</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete "{eventToDelete?.title}"? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-3 mt-4">
              <Button
                onClick={() => setDeleteDialogOpen(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700"
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                onClick={confirmDelete}
                disabled={deleting}
                className="flex-1 bg-red-600 hover:bg-red-700"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default CurrentEvents;
