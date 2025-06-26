"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase/supabase";
import Layout from "../components/Layout";
import ProjectTable from "../components/project-man-comp/project-table";
import SearchAndFilters from "../components/project-man-comp/search-filter";
import { filterProjects, formatDate } from "../utils/project-utils";
import { insertProjectAuto } from "../utils/simple-insert";
import { ProjectForm } from "./project-form";
import { Trash2, Pencil } from "lucide-react";

export default function ProjectManagementPage() {
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    status: "all",
    difficulty: "all",
    deadline: "all",
  });
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [userId, setUserId] = useState(null);
  const [editProjectId, setEditProjectId] = useState(null);
  const [editProjectData, setEditProjectData] = useState(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormLoading, setEditFormLoading] = useState(false);
  const [contextMenu, setContextMenu] = useState({
    visible: false,
    x: 0,
    y: 0,
    project: null,
  });
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState({
    key: null,
    direction: 'asc'
  });

  // Check authentication and fetch projects
  useEffect(() => {
    const checkAuthAndFetch = async () => {
      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError) throw sessionError;

        if (!session) {
          navigate("/login");
          return;
        }
        setUserId(session.user.id);
        await fetchProjects(session.user.id);
      } catch (err) {
        console.error("Auth error:", err);
        navigate("/login");
      }
    };

    checkAuthAndFetch();
  }, [navigate]);

  useEffect(() => {
    const closeMenu = () => {
      if (contextMenu.visible) {
        setContextMenu((prev) => ({ ...prev, visible: false }));
      }
    };
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [contextMenu.visible]);

  const fetchProjects = async (userId) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("projects")
        .select(
          `
          *,
          type_id:type_id ( type_name ),
          status_id:status_id ( status_name )
        `
        )
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      const mapped = data.map((p) => ({
        ...p,
        id: p.project_id,
        name: p.project_name,
        client: p.client_name,
        startDate: formatDate(p.start_date),
        deadline: formatDate(p.deadline),
        payment: p.payment_amount,
        difficulty: p.difficulty_level,
        type: p.type_id?.type_name || "-",
        status: p.status_id?.status_name || "-",
      }));

      setProjects(mapped);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const filteredProjects = useMemo(() => {
    const filtered = filterProjects(projects, searchQuery, filters);
    
    // Apply sorting if sortConfig is set
    if (sortConfig.key) {
      const sorted = [...filtered].sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle null or undefined values
        if (aValue == null && bValue == null) return 0;
        if (aValue == null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue == null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Handle date sorting (for startDate and deadline)
        if (sortConfig.key === 'startDate' || sortConfig.key === 'deadline') {
          const dateA = new Date(aValue);
          const dateB = new Date(bValue);
          const comparison = dateA.getTime() - dateB.getTime();
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        // Handle numeric sorting (for payment)
        if (sortConfig.key === 'payment') {
          const numA = parseFloat(aValue) || 0;
          const numB = parseFloat(bValue) || 0;
          const comparison = numA - numB;
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        // Handle string comparison (for name, client, type, difficulty, status)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          const comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
          return sortConfig.direction === 'asc' ? comparison : -comparison;
        }
        
        // Fallback comparison
        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
      return sorted;
    }
    
    return filtered;
  }, [projects, searchQuery, filters, sortConfig]);

  const displayProjects = filteredProjects.map((project) => ({
    ...project,
    startDate: formatDate(project.startDate),
    deadline: formatDate(project.deadline),
  }));

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-gray-200 border-t-blue-500 rounded-full animate-spin mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
          <h2 className="text-lg font-semibold text-red-600">
            Error Loading Projects
          </h2>
          <p className="text-sm text-gray-500">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="min-h-screen px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Project Management
            </h1>
            <p className="text-gray-600">
              Manage and track all your freelance projects
            </p>
          </div>

          <SearchAndFilters
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            filters={filters}
            onFiltersChange={setFilters}
            onAddProject={() => {
              setFormError(null);
              setFormSuccess(null);
              setShowProjectForm(true);
            }}
          />

          {formSuccess && (
            <div className="mb-4 p-3 rounded-lg bg-green-100 text-green-800 border border-green-200">
              {formSuccess}
            </div>
          )}
          {formError && (
            <div className="mb-4 p-3 rounded-lg bg-red-100 text-red-800 border border-red-200">
              {formError}
            </div>
          )}

          <ProjectTable
            projects={displayProjects}
            sortConfig={sortConfig}
            onSort={handleSort}
            onContextAction={(project, position) => {
              setContextMenu({
                visible: true,
                x: position.x,
                y: position.y,
                project,
              });
            }}
          />

          <div className="mt-6 text-sm text-gray-500">
            Showing {filteredProjects.length} of {projects.length} projects
          </div>
        </div>
        {showProjectForm && (
          <ProjectForm
            onClose={() => setShowProjectForm(false)}
            loading={formLoading}
            onSubmit={async (formData) => {
              console.log("userId:", userId);
              console.log("formData:", formData);

              setFormError(null);
              setFormSuccess(null);
              setFormLoading(true);
              try {
                // Validasi sederhana (bisa dikembangkan sesuai kebutuhan)
                if (!userId) throw new Error("User not authenticated");
                if (
                  !formData.name ||
                  !formData.client ||
                  !formData.startDate ||
                  !formData.deadline ||
                  formData.payment === "" ||
                  !formData.difficulty ||
                  !formData.type ||
                  !formData.status
                ) {
                  throw new Error("Please fill in all required fields.");
                }
                // Insert ke Supabase
                const projectData = {
                  user_id: userId,
                  project_name: formData.name,
                  client_name: formData.client,
                  start_date: formData.startDate,
                  deadline: formData.deadline,
                  payment_amount: formData.payment,
                  difficulty_level: formData.difficulty,
                  type_id: formData.type,
                  status_id: formData.status,
                };

                console.log("Inserting project with simple method:", projectData);

                // Use simple insert method - no SQL needed!
                const result = await insertProjectAuto(projectData);
                
                if (!result.success) {
                  throw new Error(result.error || "Failed to insert project");
                }
                
                console.log("Successfully inserted project:", result.data);
                setFormSuccess("Project successfully added!");
                setShowProjectForm(false);
                await fetchProjects(userId);
              } catch (err) {
                setFormError(err.message || "Failed to add project.");
              } finally {
                setFormLoading(false);
              }
            }}
          />
        )}
        {showEditForm && (
          <ProjectForm
            onClose={() => {
              setShowEditForm(false);
              setEditProjectId(null);
              setEditProjectData(null);
            }}
            loading={editFormLoading}
            editMode={true}
            initialData={editProjectData}
            onSubmit={async (formData) => {
              setFormError(null);
              setFormSuccess(null);
              setEditFormLoading(true);
              try {
                if (!userId) throw new Error("User not authenticated");
                if (
                  !formData.name ||
                  !formData.client ||
                  !formData.startDate ||
                  !formData.deadline ||
                  formData.payment === "" ||
                  !formData.difficulty ||
                  !formData.type ||
                  !formData.status
                ) {
                  throw new Error("Please fill in all required fields.");
                }
                // Update project in Supabase
                const { error } = await supabase
                  .from("projects")
                  .update({
                    project_name: formData.name,
                    client_name: formData.client,
                    start_date: formData.startDate,
                    deadline: formData.deadline,
                    payment_amount: formData.payment,
                    difficulty_level: formData.difficulty,
                    type_id: formData.type,
                    status_id: formData.status,
                  })
                  .eq("project_id", editProjectId);
                if (error) throw error;
                setFormSuccess("Project successfully updated!");
                setShowEditForm(false);
                setEditProjectId(null);
                setEditProjectData(null);
                await fetchProjects(userId);
              } catch (err) {
                setFormError(err.message || "Failed to update project.");
              } finally {
                setEditFormLoading(false);
              }
            }}
          />
        )}
      </div>

      {contextMenu.visible && (
        <div
          className="absolute z-50 bg-white border border-gray-100 rounded-lg shadow-md w-36"
          style={{
            top: contextMenu.y,
            left: contextMenu.x,
          }}
        >
          <button
            className=" flex items-center w-full text-left px-4 py-2 hover:bg-gray-100 rounded-lg"
            onClick={async () => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              setEditFormLoading(true);
              setEditProjectId(contextMenu.project.id);
              setShowEditForm(true);
              setEditProjectData(null);
              try {
                const { data, error } = await supabase
                  .from("projects")
                  .select("*")
                  .eq("project_id", contextMenu.project.id)
                  .single();
                if (error) throw error;
                setEditProjectData({
                  id: data.project_id,
                  name: data.project_name,
                  client: data.client_name,
                  startDate: data.start_date,
                  deadline: data.deadline,
                  payment: data.payment_amount,
                  difficulty: data.difficulty_level,
                  type: data.type_id,
                  status: data.status_id,
                });
              } catch (err) {
                setFormError("Failed to load project data.");
                setShowEditForm(false);
              } finally {
                setEditFormLoading(false);
              }
            }}
          >
            <Pencil className="w-4 h-4 mr-3" />
            Edit
          </button>
          <button
            className="flex items-center w-full text-left px-4 py-2 text-red-600 hover:bg-red-50"
            onClick={() => {
              setContextMenu((prev) => ({ ...prev, visible: false }));
              setShowDeleteConfirm(true);
            }}
          >
            <Trash2 className="w-4 h-4 mr-3" />
            Delete
          </button>
        </div>
      )}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-md p-6 w-[90%] max-w-md">
            <h2 className="text-lg font-semibold mb-4 text-gray-800">
              Are you sure you want to delete this project?
            </h2>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  setDeleteLoading(true);
                  try {
                    const { error } = await supabase
                      .from("projects")
                      .delete()
                      .eq("project_id", contextMenu.project.id);
                    if (error) throw error;
                    setShowDeleteConfirm(false);
                    await fetchProjects(userId);
                  } catch (err) {
                    setFormError("Failed to delete project.");
                  } finally {
                    setDeleteLoading(false);
                  }
                }}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-red-700"
              >
                {deleteLoading ? "Deleting..." : "Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
