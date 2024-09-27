import { useState, useEffect } from 'react';
import { FaEdit, FaTrash, FaSync, FaDatabase } from 'react-icons/fa';

const App = () => {
  const [spreadsheetId, setSpreadsheetId] = useState(localStorage.getItem('spreadsheetId') || '');
  const [connected, setConnected] = useState(!!spreadsheetId);
  const [students, setStudents] = useState([]);
  const [newStudent, setNewStudent] = useState({ name: '', email: '', course: '', grade: '' });
  const [editingStudent, setEditingStudent] = useState(null);

  useEffect(() => {
    if (connected) {
      fetchStudents();
    }
  }, [connected]);

  const connectToSheet = async () => {
    try {
      const response = await fetch('http://localhost:3000/students/connect', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ spreadsheetId }),
      });

      const data = await response.json();
      if (data.success) {
        localStorage.setItem('spreadsheetId', spreadsheetId);
        setConnected(true);
        fetchStudents();
      }
    } catch (error) {
      console.error('Error connecting to sheet:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await fetch('http://localhost:3000/students');
      const data = await response.json();
      if (Array.isArray(data)) {
        setStudents(data);
      } else {
        console.error('Unexpected data format:', data);
        setStudents([]); // Clear state if data format is unexpected
      }
    } catch (error) {
      console.error('Error fetching students:', error);
    }
  };

  const addStudent = async () => {
    try {
      await fetch('http://localhost:3000/students', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newStudent),
      });
      fetchStudents(); // Refresh student list
      setNewStudent({ name: '', email: '', course: '', grade: '' });
    } catch (error) {
      console.error('Error adding student:', error);
    }
  };

  const deleteStudent = async (email) => {
    try {
      await fetch(`http://localhost:3000/students/${email}`, {
        method: 'DELETE',
      });
      fetchStudents(); // Refresh student list
    } catch (error) {
      console.error('Error deleting student:', error);
    }
  };

  const updateStudent = async () => {
    try {
      await fetch(`http://localhost:3000/students/${editingStudent.email}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editingStudent),
      });
      fetchStudents(); // Refresh student list
      setEditingStudent(null);
    } catch (error) {
      console.error('Error updating student:', error);
    }
  };

  const syncToSheet = async () => {
    try {
      await fetch('http://localhost:3000/sync');
      alert('Synced to db successfully');
    } catch (error) {
      alert('Error syncing to db:', error);
    }
  };

  const syncToDb = async () => {
    try {
      await fetch('http://localhost:3000/sync-db');
      alert('Synced to sheet successfully');
    } catch (error) {
      alert('Error syncing to sheet:', error);
    }
  };

  const connectNewSheet = async () => {
    try {
      setConnected(false);
      console.log('Connected to new sheet successfully');
    } catch (error) {
      console.error('Error connecting to new sheet:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-200 flex flex-col items-center p-6">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl p-8">
        <h1 className="text-4xl font-bold text-gray-900 text-center mb-8 border-b-2 border-gray-300 pb-4">Superjoin Assignment by Mohammad Shaad</h1>

        {!connected ? (
          <div className="text-center">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Connect to Google Sheets</h2>
            <input
              type="text"
              className="border border-gray-300 p-4 rounded-lg w-full max-w-md mx-auto focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
              placeholder="Enter Google Sheet ID"
              value={spreadsheetId}
              onChange={(e) => setSpreadsheetId(e.target.value)}
            />
            <button
              className="bg-blue-600 text-white px-6 py-3 rounded-lg mt-4 hover:bg-blue-700 transition duration-300"
              onClick={connectToSheet}
            >
              Connect
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Add New Student</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                  placeholder="Name"
                  value={newStudent.name}
                  onChange={(e) => setNewStudent({ ...newStudent, name: e.target.value })}
                />
                <input
                  type="email"
                  className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                  placeholder="Email"
                  value={newStudent.email}
                  onChange={(e) => setNewStudent({ ...newStudent, email: e.target.value })}
                />
                <input
                  type="text"
                  className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                  placeholder="Course"
                  value={newStudent.course}
                  onChange={(e) => setNewStudent({ ...newStudent, course: e.target.value })}
                />
                <input
                  type="text"
                  className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                  placeholder="Grade"
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({ ...newStudent, grade: e.target.value })}
                />
                <button
                  className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300"
                  onClick={addStudent}
                >
                  Add Student
                </button>
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-2xl font-semibold text-gray-800 mb-4">Student List</h2>
              {Array.isArray(students) && students.length > 0 ? (
                <table className="w-full bg-white border border-gray-300 rounded-lg overflow-hidden">
                  <thead className="bg-gray-100 text-gray-700">
                    <tr>
                      <th className="border-b py-2 px-4 text-left">Name</th>
                      <th className="border-b py-2 px-4 text-left">Email</th>
                      <th className="border-b py-2 px-4 text-left">Course</th>
                      <th className="border-b py-2 px-4 text-left">Grade</th>
                      <th className="border-b py-2 px-4 text-left">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => (
                      <tr key={student.email} className="hover:bg-gray-50 transition duration-300">
                        <td className="border-b py-2 px-4">{student.name}</td>
                        <td className="border-b py-2 px-4">{student.email}</td>
                        <td className="border-b py-2 px-4">{student.course}</td>
                        <td className="border-b py-2 px-4">{student.grade}</td>
                        <td className="border-b py-2 px-4 flex gap-2 justify-center">
                          <button
                            className="bg-yellow-500 text-white px-4 py-2 rounded-lg hover:bg-yellow-600 transition duration-300"
                            onClick={() => setEditingStudent(student)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition duration-300"
                            onClick={() => deleteStudent(student.email)}
                          >
                            <FaTrash />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="text-gray-600 text-center">No students found.</p>
              )}
            </div>
          </div>
        )}

        <div className="mt-8 flex justify-between">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            onClick={syncToSheet}
          >
            <FaDatabase /> Sync to Sheet
          </button>
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition duration-300"
            onClick={syncToDb}
          >
            <FaSync /> Sync to DB
          </button>
        </div>

        {editingStudent && (
          <div className="bg-white p-6 rounded-lg shadow-md mt-8">
            <h2 className="text-2xl font-semibold text-gray-800 mb-4">Edit Student</h2>
            <div className="space-y-4">
              <input
                type="text"
                className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                placeholder="Name"
                value={editingStudent.name}
                onChange={(e) => setEditingStudent({ ...editingStudent, name: e.target.value })}
              />
              <input
                type="email"
                className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                placeholder="Email"
                value={editingStudent.email}
                onChange={(e) => setEditingStudent({ ...editingStudent, email: e.target.value })}
              />
              <input
                type="text"
                className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                placeholder="Course"
                value={editingStudent.course}
                onChange={(e) => setEditingStudent({ ...editingStudent, course: e.target.value })}
              />
              <input
                type="text"
                className="border border-gray-300 p-4 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-blue-500 transition duration-300"
                placeholder="Grade"
                value={editingStudent.grade}
                onChange={(e) => setEditingStudent({ ...editingStudent, grade: e.target.value })}
              />
              <button
                className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition duration-300"
                onClick={updateStudent}
              >
                Update Student
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
