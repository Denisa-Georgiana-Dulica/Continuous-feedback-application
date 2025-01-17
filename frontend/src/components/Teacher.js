import React, { useState, useEffect } from "react";
import "./Teacher.css";

const Teacher = () => {
  const [activities, setActivities] = useState([]);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [feedback, setFeedback] = useState({});

  const backendUrl = process.env.REACT_APP_BACKEND_URL;
  console.log(activities);
  console.log(feedback);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem("teacherToken");
        const teacherId = localStorage.getItem("teacherId");

        const response = await fetch(`${backendUrl}/teacher-activities-for-students/${teacherId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.ok) {
          const data = await response.json();
          setActivities(data.activities);
        } else {
          setError("Failed to fetch activities.");
        }
      } catch (err) {
        setError("Something went wrong. Please try again.");
      }
    };

    fetchActivities();
  }, [backendUrl]);

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        const token = localStorage.getItem("teacherToken");
        const response = await fetch(`${backendUrl}/teacher-activities`, {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        if (response.ok) {
          const data = await response.json();
          const feedbackMap = {};
  
          data.activities.forEach((activity) => {
            if (activity.Reactions && activity.Reactions.length > 0) {
              feedbackMap[activity.activitiesId] = activity.Reactions;
            }
          });
  
          setFeedback(feedbackMap);
        } else {
          console.error("Failed to fetch feedback:", response.statusText);
        }
      } catch (err) {
        console.error("Error fetching feedback:", err);
      }
    };
  
    fetchFeedback();
  }, [backendUrl]);
  
  const handleAddActivity = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("teacherToken");
      const response = await fetch(`${backendUrl}/activities`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          title,
          description,
          start_date: startDate,
          end_date: endDate,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setActivities((prev) => [...prev, data.activity]);
        setSuccess("Activity added successfully!");
        setError("");
        setTitle("");
        setDescription("");
        setStartDate("");
        setEndDate("");
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to add activity.");
      }
    } catch (err) {
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <div className="teacher-dashboard">
      <h2>Teacher Dashboard</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}

      <div className="dashboard-container">
        {/* Existing Activities Section */}
        <div className="activities-list">
          <h3>Existing Activities</h3>
          <ul>
            {activities.length > 0 ? (
              activities.map((activity) => (
                <li key={activity.activitiesId}>
                  <strong>{activity.title}</strong> - {activity.description} (
                  {new Date(activity.start_date).toLocaleDateString()} to{" "}
                  {new Date(activity.end_date).toLocaleDateString()})
                  <span style={{ marginLeft: "10px", color: "green" }}>
                    Code: {activity.code}
                  </span>
                  {/* Afișează feedback-ul */}
                  <ul className="feedback-list">
                    {feedback[activity.activitiesId] &&
                    feedback[activity.activitiesId].length > 0 ? (
                      feedback[activity.activitiesId].map((fb, index) => (
                        <li key={index}>
                          {fb.emoji} -{" "}
                          {new Date(fb.timestamp).toLocaleString()}
                        </li>
                      ))
                    ) : (
                      <li>No feedback yet.</li>
                    )}
                  </ul>
                </li>
              ))
            ) : (
              <p>No activities found.</p>
            )}
          </ul>
        </div>

        {/* Add New Activity Form Section */}
        <div className="add-activity-form">
          <h3>Add New Activity</h3>
          <form onSubmit={handleAddActivity}>
            <div>
              <label>Title:</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <div>
              <label>Description:</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
              ></textarea>
            </div>
            <div>
              <label>Start Date:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label>End Date:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
              />
            </div>
            <button type="submit">Add Activity</button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Teacher;
