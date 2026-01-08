import React, { useState } from "react";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import "../../styles/HelpButton.css";

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [taskImageIndex, setTaskImageIndex] = useState(0);

  const welcomeImages = ["/anh1.png", "/anh2.png", "/anh3.png"];
  const taskImages = ["/anh6.png", "/anh7.png"];

  // Nội dung hướng dẫn cho từng trang
  const guidePages = [
    {
      title: "Welcome to KEN",
      content: (
        <div className="guide-layout-2col">
          <div className="guide-text-section">
            <h3>KEN Project Management</h3>
            <p>
              KEN is a comprehensive project management platform designed to
              help teams collaborate efficiently, track progress, and reach
              goals faster.
            </p>

            <div className="feature-highlight">
              <h4>Why choose KEN?</h4>
              <div className="feature-list">
                <div className="feature-item">
                  <span className="feature-icon"></span>
                  <div>
                    <h5>Smart project management</h5>
                    <p>
                      Organize and monitor multiple projects with an intuitive,
                      easy-to-use interface.
                    </p>
                  </div>
                </div>

                <div className="feature-item">
                  <span className="feature-icon"></span>
                  <div>
                    <h5>Effective team collaboration</h5>
                    <p>
                      Collaborate smoothly with flexible permissions and simple
                      user management.
                    </p>
                  </div>
                </div>

                <div className="feature-item">
                  <span className="feature-icon"></span>
                  <div>
                    <h5>Real-time updates</h5>
                    <p>
                      Receive instant progress updates so you never miss
                      important changes.
                    </p>
                  </div>
                </div>

                <div className="feature-item">
                  <span className="feature-icon"></span>
                  <div>
                    <h5>Reporting & analytics</h5>
                    <p>
                      Detailed metrics to evaluate performance and make informed
                      decisions.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="info-box">
              <h4>Get started today!</h4>
              <p>
                Explore KEN's powerful features to boost your team's
                productivity.
              </p>
            </div>
          </div>

          <div className="guide-image-carousel">
            <div className="carousel-container">
              <button
                className="carousel-btn carousel-btn-prev"
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === 0 ? welcomeImages.length - 1 : prev - 1
                  )
                }
              >
                <ChevronLeft />
              </button>

              <div className="carousel-image-wrapper">
                <img
                  src={welcomeImages[currentImageIndex]}
                  alt={`KEN Screenshot ${currentImageIndex + 1}`}
                  className="guide-image carousel-image"
                />
              </div>

              <button
                className="carousel-btn carousel-btn-next"
                onClick={() =>
                  setCurrentImageIndex((prev) =>
                    prev === welcomeImages.length - 1 ? 0 : prev + 1
                  )
                }
              >
                <ChevronRight />
              </button>
            </div>

            <div className="carousel-indicators">
              {welcomeImages.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-indicator ${
                    index === currentImageIndex ? "active" : ""
                  }`}
                  onClick={() => setCurrentImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Groups Management",
      content: (
        <div className="guide-layout-2col">
          <div className="guide-text-section">
            <h3>Working with Groups</h3>
            <p>
              Groups help you organize and manage working teams within KEN
              efficiently.
            </p>

            <div className="step-item">
              <h4>Step 1: Open Groups</h4>
              <p>
                From the left sidebar, click <strong>"Groups"</strong> to view
                your team groups.
              </p>
            </div>

            <div className="step-item green">
              <h4>Step 2: Select a Group</h4>
              <p>
                Click a group to view it, or create a new one using the
                <strong> "CREATE GROUP"</strong> button.
              </p>
            </div>

            <div className="step-item purple">
              <h4>Step 3: Add members</h4>
              <p>
                After selecting a group, click <strong>"MANAGE USERS"</strong>
                to add members.
              </p>
              <p>
                You can assign roles to members: Admin, Member, or Guest.
              </p>
            </div>

            <div className="info-box">
              <h4>Helpful tips:</h4>
              <ul>
                <li>Use <strong>"EDIT"</strong> to modify group information</li>
                <li>Use <strong>"REMOVE GROUP"</strong> to delete unused groups</li>
                <li>Each member shows an avatar and a clear role</li>
              </ul>
            </div>
          </div>

          <div className="guide-image-container">
            <img
              src="/1.png"
              alt="Groups management guide"
              className="guide-image"
            />
          </div>
        </div>
      ),
    },
    {
      title: "Task Management - Drag & Drop & CRUD",
      content: (
        <div className="guide-layout-2col">
          <div className="guide-text-section">
            <h3>Working with the Task Board</h3>
            <p>
              The interactive Kanban board helps you manage work effectively
              with drag-and-drop support and full CRUD capabilities.
            </p>

            <div className="feature-highlight">
              <h4>Drag & drop Tasks</h4>
              <div className="step-item">
                <h4>Step 1: Move a task</h4>
                <p>
                  Click and hold a task, then drag it to another column (To
                  Do → In Progress → Done) to update its status.
                </p>
              </div>

              <div className="step-item green">
                <h4>Step 2: Reorder tasks</h4>
                <p>
                  Drag tasks up or down within the same column to set
                  priorities.
                </p>
              </div>
            </div>

            <div className="feature-highlight">
              <h4>Full CRUD functionality</h4>
              <div className="crud-grid">
                <div className="crud-item">
                  <h5>Create - Add Task</h5>
                  <p>
                    Click the <strong>"+ Add Task"</strong> button to create a
                    new task with a title, description, and details.
                  </p>
                </div>

                <div className="crud-item">
                  <h5>Read - View details</h5>
                  <p>
                    Click a task to view full information: description, tags,
                    assignee, and deadline.
                  </p>
                </div>

                <div className="crud-item">
                  <h5>Update - Edit</h5>
                  <p>
                    Update task details: rename, edit description, change
                    tags, or assign to others.
                  </p>
                </div>

                <div className="crud-item">
                  <h5>Delete - Remove Task</h5>
                  <p>
                    Remove unnecessary tasks using the delete button in the
                    task details.
                  </p>
                </div>
              </div>
            </div>

            <div className="feature-highlight">
              <h4>Advanced features</h4>
              <ul>
                <li>
                  <strong>Tags Management:</strong> Create, edit, and delete
                  tags with custom colors
                </li>
                <li>
                  <strong>Assign Members:</strong> Assign tasks to multiple
                  members at once
                </li>
                <li>
                  <strong>Set Deadline:</strong> Set deadlines and receive
                  notifications
                </li>
                <li>
                  <strong>Filter & Search:</strong> Filter tasks by tags,
                  assignee, or status
                </li>
              </ul>
            </div>
          </div>

          <div className="guide-image-carousel">
            <div className="carousel-container">
              <button
                className="carousel-btn carousel-btn-prev"
                onClick={() =>
                  setTaskImageIndex((prev) =>
                    prev === 0 ? taskImages.length - 1 : prev - 1
                  )
                }
              >
                <ChevronLeft />
              </button>

              <div className="carousel-image-wrapper">
                <img
                  src={taskImages[taskImageIndex]}
                  alt={`Task Management ${taskImageIndex + 1}`}
                  className="guide-image carousel-image"
                />
              </div>

              <button
                className="carousel-btn carousel-btn-next"
                onClick={() =>
                  setTaskImageIndex((prev) =>
                    prev === taskImages.length - 1 ? 0 : prev + 1
                  )
                }
              >
                <ChevronRight />
              </button>
            </div>

            <div className="carousel-indicators">
              {taskImages.map((_, index) => (
                <button
                  key={index}
                  className={`carousel-indicator ${
                    index === taskImageIndex ? "active" : ""
                  }`}
                  onClick={() => setTaskImageIndex(index)}
                />
              ))}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Permissions and Security",
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">
            Managing access control
          </h3>
          <div className="space-y-3">
            <div className="bg-red-50 p-4 rounded-lg">
              <h4 className="font-semibold text-red-900 mb-2">Admin</h4>
              <p className="text-red-800">
                Full control over the system, users, and projects
              </p>
            </div>
            <div className="bg-yellow-50 p-4 rounded-lg">
              <h4 className="font-semibold text-yellow-900 mb-2">
                Project Manager
              </h4>
              <p className="text-yellow-800">
                Manage projects, add/remove members, and create tasks
              </p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900 mb-2">Member</h4>
              <p className="text-green-800">View and update assigned tasks</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Reports and Analytics",
      content: (
        <div className="space-y-4">
          <h3 className="text-2xl font-bold text-gray-800">Track progress</h3>
          <p className="text-gray-600">
            Use the Reports page to view detailed reports on project progress,
            team performance, and key metrics.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Dashboard</h4>
              <p className="text-sm text-gray-600">
                Overview of all projects, ongoing tasks, and upcoming
                deadlines
              </p>
            </div>
            <div className="border border-gray-200 p-4 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Analytics</h4>
              <p className="text-sm text-gray-600">
                Analyze trends, completion velocity, and other metrics
              </p>
            </div>
          </div>
          <div className="bg-blue-100 p-4 rounded-lg mt-4">
            <p className="text-blue-900 font-medium">
              Tip: Export periodic reports to monitor team performance!
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextPage = () => {
    if (currentPage < guidePages.length - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const prevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const handleClose = () => {
    setCurrentPage(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay guide-modal-overlay" onClick={handleClose}>
      <div
        className="modal-container guide-modal-content"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">{guidePages[currentPage].title}</h2>
          <button onClick={handleClose} className="modal-close-btn">
            <X />
          </button>
        </div>

        {/* Content */}
        <div
          className="modal-content guide-modal-scroll guide-page-content"
          key={currentPage}
        >
          {guidePages[currentPage].content}
        </div>

        {/* Footer with pagination */}
        <div className="modal-footer">
          <div className="pagination-controls">
            <button
              onClick={prevPage}
              disabled={currentPage === 0}
              className="pagination-btn"
            >
              <ChevronLeft />
                Previous Page
            </button>

            <div className="pagination-dots">
              {guidePages.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentPage(index)}
                  className={`pagination-dot ${
                    index === currentPage ? "active" : ""
                  }`}
                    title={`Page ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={nextPage}
              disabled={currentPage === guidePages.length - 1}
              className="pagination-btn"
            >
                Next Page
              <ChevronRight />
            </button>
          </div>

          <div className="page-indicator">
            Page {currentPage + 1} / {guidePages.length}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuideModal;
