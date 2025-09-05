/* Doctor dashboard page */
import {useEffect, useState} from 'react';
import io from 'socket.io-client';
import {Link, useHistory} from 'react-router-dom';
import {useFetchUser} from '../../context/userContext';
import useTokenCheck from '../../helper/doctorTokenCheck';
import Axios from 'axios';
import IncommingCall from '../../components/IncommingCall';
import Spinner from '../../components/Spinner'
const API_BASE_URL = process.env.REACT_APP_API_URL;

const DoctorDashboard = () => {
  useTokenCheck(); // check for token
  const [socket, setSocket] = useState(null); // socket
  const [call, setCall] = useState(null);
  const history = useHistory();
  const {state} = useFetchUser(); // user information
  

  // Medical Record
  const [mr, setMr] = useState({
    data: [],
    isPending: true,
    error: null,
  });

  console.log(mr);

  useEffect(() => {
    const socketUrl = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';
    const newSocket = io(socketUrl, {
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      transports: ['websocket', 'polling']
    });
    
    console.log("Connecting to socket server at:", socketUrl);
    
    // Socket connection status handling
    newSocket.on('connect', () => {
      console.log('Socket connected successfully with ID:', newSocket.id);
      if (state.data) {
        console.log(`Setting doctor ${state.data.id} as online`);
        // Make doctor available for patients
        newSocket.emit('online-user', newSocket.id, state.data.id);
        
        // Log doctor's online status
        console.log(`Doctor ${state.data.id} is now online and available for calls`);
      }
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });
    
    if (state.data) {
      fetchMR(setMr, state.data.id);
      setSocket(newSocket);
      
      // Set up call handling
      newSocket.on('retrieve', (message) => {
        console.log("Received call request:", message);
        setCall(message);
      });
    }
    
    // Cleanup on unmount
    return () => {
      if (newSocket) {
        console.log("Disconnecting doctor from online status");
        newSocket.disconnect();
      }
    };
  }, [setSocket, state.data, setMr]);

  // answer call 
  const answerCall = (accept = true) => {
    if (!socket || !call) {
      console.error("Cannot answer call: socket or call info missing");
      return;
    }
    
    try {
      console.log(`${accept ? 'Accepting' : 'Declining'} call from ${call.from}`);
      socket.emit('answerCall', call.from, accept);
      
      if (accept) {
        // Get patient information if available
        let patientInfo = { id: undefined, name: "Unknown Patient" };
        
        // Check if patient info is in the call object
        if (call.patient && typeof call.patient === 'object' && call.patient.id) {
          patientInfo = call.patient;
        } else if (typeof call.patient === 'string') {
          // If it's just a name string, create a minimal object with no ID
          patientInfo.name = call.patient;
        }
        
        // Allow time for the signal to reach the patient
        var delayInMilliseconds = 1000;
        setTimeout(function () {
          history.push({
            pathname: `/call/${call.url}`,
            state: {
              type: 'doctor', 
              user: patientInfo
            },
          });
        }, delayInMilliseconds);
      } else {
        // Reset call state if declined
        setCall(null);
      }
    } catch (err) {
      console.error("Error answering call:", err);
      alert("An error occurred while answering the call. Please try again.");
    }
  };

  if (mr.isPending) {
    return <Spinner/> ;
  } else {
    return (
      <div className='font-fontPro'>
        <div>
          {call && <IncommingCall answerCall={answerCall} />}
        </div>

        <div className='mt-10 mb-5 mx-auto max-w-7xl w-full px-10 flex flex-col space-y-4'>
          <div className='mx-auto max-w-7xl w-full flex justify-between mb-3'>
            <h1 className='text-3xl'>Past Appointment</h1>
            {/* { <button className="px-4 py-2 rounded-md bg-blue-400 text-white">Add</button>} */}
          </div>
          <div className='flex flex-col'>
            <div className='-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8'>
              <div className='py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8'>
                <div className='shadow overflow-hidden border-b border-gray-200 sm:rounded-lg'>
                  <table className='min-w-full divide-y divide-gray-200'>
                    <thead className='bg-gray-50'>
                      <tr key=''>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-base font-medium  text-gray-500 uppercase tracking-wider'
                        >
                          Patient
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Date
                        </th>
                        <th
                          scope='col'
                          className='px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider'
                        >
                          Illness
                        </th>
                      </tr>
                    </thead>
                    <tbody className='bg-white divide-y divide-gray-200'>
                      {mr.data &&
                        mr.data.map((data) => (
                          <tr key={data.id ? data.id : Math.random()}>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='text-base font-medium text-gray-900'>
                                {data.patient.name}
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <div className='text-base text-gray-900'>
                                {data.date.split('T')[0]}
                              </div>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap'>
                              <span className='px-2 inline-flex text-base leading-5 '>
                                {data.illness}
                              </span>
                            </td>
                            <td className='px-6 py-4 whitespace-nowrap '>
                              <Link
                                className='text-base font-bold text-purple-500 hover:text-pink-500'
                                to={`/doctor/medicalRecord/${data.id}`}
                              >
                                View
                              </Link>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
};

// eslint-disable-next-line no-unused-vars
const connectUser = (socket, userid, setCall) => {
  socket.on('connect', () => {
    socket.emit('online-user', socket.id, userid);
  });
  // socket.on('updateuserList', (users) => {
  //   console.log(users);
  // });
};

const fetchMR = (setMr, id) => {
  const fetchData = async () => {
    try {
      let res = await Axios.get(
        `${API_BASE_URL}/medicalRecord/?sort=-date&doctor=${id}`,
        {
          headers: {
            'x-acess-token': localStorage.getItem('token'),
          },
        }
      );
      let data = res.data.data;

      if (!Array.isArray(data)) {
        data = [data];
      }
      setMr({
        data: data,
        isPending: false,
        error: null,
      });
    } catch (error) {
      setMr({
        data: null,
        isPending: false,
        error: error,
      });
    }
  };
  fetchData();
};

export default DoctorDashboard;
