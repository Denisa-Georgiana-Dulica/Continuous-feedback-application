import React, { useState, useEffect } from "react";
import "./Student.css"

const Student = () => {
  const [teachers, setTeachers] = useState([]);
  const [activities, setActivities] = useState([]);
  const [selectedTeacher, setSelectedTeacher] = useState("");
  const [codes, setCodes] = useState({});
  const [validatedActivities, setValidatedActivities] = useState({});
  const [message, setMessage] = useState("");
  const [loadingTeachers, setLoadingTeachers] = useState(true);
  const [loadingActivities, setLoadingActivities] = useState(false);
  const [selectedReactions, setSelectedReactions] = useState({});
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        const response = await fetch(`${backendUrl}/show_teachers`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
          },
        });

        if (response.ok) {
          const data = await response.json();
          setTeachers(data.teachers);
        } else {
          setMessage("Failed to fetch teachers.");
        }
      } catch (error) {
        setMessage("Error fetching teachers.");
      } finally {
        setLoadingTeachers(false);
      }
    };

    fetchTeachers();
  }, [backendUrl]);

  const fetchActivities = async (teacherId) => {
    if (!teacherId) return;

    setLoadingActivities(true);
    setActivities([]);

    try {
      const response = await fetch(
        `${backendUrl}/teacher-activities-for-students/${teacherId}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
          },
        }
      );

      if (response.ok) {
        const data = await response.json();
        setActivities(data.activities);
        const initialCodes = data.activities.reduce((acc, activity) => {
          acc[activity.activitiesId] = "";
          return acc;
        }, {});
        setCodes(initialCodes);
      } else {
        setMessage("Failed to fetch activities.");
      }
    } catch (error) {
      setMessage("Error fetching activities.");
    } finally {
      setLoadingActivities(false);
    }
  };

  const handleCodeChange = (activityId, newCode) => {
    setCodes((prevCodes) => ({
      ...prevCodes,
      [activityId]: newCode,
    }));
  };

  const validateCode = async (activityId, codeActivity) => {
    try {
      const response = await fetch(`${backendUrl}/validate-code`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
        },
        body: JSON.stringify({
          activity_id: activityId,
          code_activity: codeActivity,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Code valid! Activity: ${data.chosen_activity.title}`);
        setValidatedActivities((prev) => ({
          ...prev,
          [activityId]: true,
        }));
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Code validation failed.");
      }
    } catch (error) {
      setMessage("Error validating code.");
    }
  };

  const handleReaction = async (activityId) => {
    const selectedReaction = selectedReactions[activityId];
    if (!selectedReaction) {
      setMessage("Please select a reaction before submitting.");
      return;
    }

    try {
      const response = await fetch(`${backendUrl}/student_feedback`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("studentToken")}`,
        },
        body: JSON.stringify({
          activity_id: activityId,
          emoji: selectedReaction,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessage(`Feedback submitted: ${data.reaction.emoji}`);
      } else {
        const errorData = await response.json();
        setMessage(errorData.error || "Failed to submit feedback.");
      }
    } catch (error) {
      setMessage("Error submitting feedback.");
    }
  };

  const handleReactionSelect = (activityId, reaction) => {
    setSelectedReactions((prev) => ({
      ...prev,
      [activityId]: reaction,
    }));
  };

  return (
    <div className="student-dashboard">
      <h2>Student Dashboard</h2>
      {message && <p>{message}</p>}

      {loadingTeachers && <p>Loading teachers...</p>}

      {!loadingTeachers && (
        <div>
          <label>Select a Teacher:</label>
          <select
            value={selectedTeacher}
            onChange={(e) => {
              setSelectedTeacher(e.target.value);
              fetchActivities(e.target.value);
            }}
          >
            <option value="">-- Select a Teacher --</option>
            {teachers.map((teacher) => (
              <option key={teacher.userId} value={teacher.userId}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
      )}

      {loadingActivities && <p>Loading activities...</p>}

      {selectedTeacher && activities.length > 0 && !loadingActivities && (
        <div>
          <h3>Activities</h3>
          <ul>
            {activities.map((activity) => (
              <li key={activity.activitiesId}>
                <strong>{activity.title}</strong> -{" "}
                {new Date(activity.start_date).toLocaleDateString()} to{" "}
                {new Date(activity.end_date).toLocaleDateString()}

                {!validatedActivities[activity.activitiesId] && (
                  <div>
                    <label>Enter Code:</label>
                    <input
                      type="text"
                      value={codes[activity.activitiesId] || ""}
                      onChange={(e) =>
                        handleCodeChange(activity.activitiesId, e.target.value)
                      }
                    />
                    <button
                      onClick={() =>
                        validateCode(activity.activitiesId, codes[activity.activitiesId])
                      }
                    >
                      Validate Code
                    </button>
                  </div>
                )}

{validatedActivities[activity.activitiesId] && (
  <div className="reactions-container">
    <table>
      <thead>
        <tr>
          <th>Reactions</th>
          <th>Select</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          {["😊", "😞"].map((emoji) => (
            <td
              key={emoji}
              className={`reaction-cell ${
                selectedReactions[activity.activitiesId] === emoji
                  ? "selected"
                  : ""
              }`}
              onClick={() => handleReactionSelect(activity.activitiesId, emoji)}
            >
              {emoji}
            </td>
          ))}
        </tr>
        <tr>
          {["😲", "🤔"].map((emoji) => (
            <td
              key={emoji}
              className={`reaction-cell ${
                selectedReactions[activity.activitiesId] === emoji
                  ? "selected"
                  : ""
              }`}
              onClick={() => handleReactionSelect(activity.activitiesId, emoji)}
            >
              {emoji}
            </td>
          ))}
        </tr>
      </tbody>
    </table>
    <button
      onClick={() => handleReaction(activity.activitiesId)}
      disabled={!selectedReactions[activity.activitiesId]}
    >
      Submit Feedback
    </button>
  </div>
)}
                
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default Student;
