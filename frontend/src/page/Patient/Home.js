import useTokenCheck from '../../helper/tokenCheck';
import {useEffect, useState} from 'react';
import io from 'socket.io-client';
import Axios from 'axios';
import DoctorCard from '../../components/DoctorCard';
import Spinner from '../../components/Spinner';
const API_BASE_URL = process.env.REACT_APP_API_URL;

function Home() {
  useTokenCheck(); // token check
  // eslint-disable-next-line 
  const [socket, setSocket] = useState(null);
  //online doctor list
  const [onlineDoc, setOnlineDoc] = useState({
    data: [],
    isPending: true,
    error: null,
  });
  // search
  const [type, setType] = useState('All');
  const [search, setSearch] = useState('');
  const [specialization, setSpec] = useState({
    data: [],
    isPending: true,
    error: null,
  });


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
      // Request online doctor list after successful connection
      console.log("Requesting online doctors...");
      newSocket.emit('get-online-doctor', newSocket.id);
    });
    
    newSocket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      alert('Error connecting to the server. Please check your internet connection and try again.');
    });
    
    newSocket.on('updateDoctorList', (doctor) => {
      console.log("Received doctor list:", doctor);
      
      if (Object.keys(doctor).length === 0) {
        console.log("No doctors online");
        setOnlineDoc({
          data: [],
          isPending: false,
          error: 'No doctor Online',
        });
      } else {
        console.log(`Found ${Object.keys(doctor).length} online doctors, fetching their data...`);
        fetchDoctorData(Object.keys(doctor), setOnlineDoc, type, search);
      }
    });
    
    setSocket(newSocket);
    
    // Cleanup on unmount
    return () => {
      if (newSocket) {
        console.log("Disconnecting socket on cleanup");
        newSocket.disconnect();
      }
    };
  }, [setSocket, type, search]);
  
  // Fetch specialization in a separate useEffect
  useEffect(() => {
    fetchSpecialization(setSpec);
  }, [setSpec]);


  // Improve the error handling for the filter by type
  if (onlineDoc.isPending) {
    return <Spinner />;
  } else if (!onlineDoc.isPending && (!onlineDoc.data || onlineDoc.data.length === 0)) {
    return (
      <div className='flex justify-center items-center mt-52'>
        <h1 className='font-fontPro text-4xl text-gray-700'>
          {type !== 'All' || search !== '' 
            ? "No doctors match your search criteria" 
            : "There are no online doctors at this moment."}
        </h1>
      </div>
    );
  } else {
    return (
      <div className='antialiased flex flex-col mt-10'>
        <form
          action=''
          className=' mx-auto max-w-7xl w-full inputs space-y-6 px-10'
        >
          <div className='flex space-x-4'>
            <div className='lg:w-10/12 w-9/12'>
              <label className='px-1 text-black text-xs lg:text-sm'>
                Search by name
              </label>
              <div className='flex'>
                <input
                  className='block appearance-none w-full pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none '
                  type='text'
                  name='search-doc'
                  id='search-doc'
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            <div className='lg:w-2/12 w-3/12'>
              <label className='text-xs lg:text-sm px-1 text-black'>
                Specialization
              </label>
              <div className='relative'>
                <select
                  id='type'
                  className='block appearance-none w-full pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none '
                  onChange={(e) => setType(e.target.value)}
                >
                  <option key='All' value='All'>
                    All{' '}
                  </option>
                  {specialization.data &&
                    specialization.data.map((item) => (
                      <option
                        key={item.specialization}
                        value={item.specialization}
                      >
                        {item.specialization}
                      </option>
                    ))}
                </select>
                <div className='pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700'>
                  <svg
                    className='fill-current h-4 w-4'
                    xmlns='http://www.w3.org/2000/svg'
                    viewBox='0 0 20 20'
                  >
                    <path d='M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z' />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </form>

        {onlineDoc.data.length === 0 && <div className='flex justify-center items-center mt-32'>
        <h1 className='font-fontPro text-3xl text-gray-700'>Can't find any doctor that you are looking for</h1>
      </div>}
        <div className='my-10 mx-auto max-w-7xl w-full px-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7'>
          
          {!onlineDoc.isPending && onlineDoc.data && onlineDoc.data.length > 0 ? (
            onlineDoc.data.map((data) => (
              <DoctorCard key={data._id || data.name} doctor={data} />
            ))
          ) : (
            <div className="col-span-3 flex justify-center items-center mt-10">
              <h1 className='font-fontPro text-2xl text-gray-600'>No doctors match your search criteria</h1>
            </div>
          )}
        </div>
      </div>
    );
  }
}

// get all avaliable doctors
// eslint-disable-next-line no-unused-vars
const getOnlineDoc = (socket, setOnlineDoc, type, search) => {
  console.log("Requesting online doctor list...");
  socket.emit('get-online-doctor', socket.id);
  
  socket.on('updateDoctorList', (doctor) => {
    console.log("Received doctor list:", doctor);
    
    if (Object.keys(doctor).length === 0) {
      console.log("No doctors online");
      setOnlineDoc({
        data: [],
        isPending: false,
        error: 'No doctor Online',
      });
    } else {
      console.log(`Found ${Object.keys(doctor).length} online doctors, fetching their data...`);
      fetchDoctorData(Object.keys(doctor), setOnlineDoc, type, search);
    }
  });
};

// get doctor data by id
const fetchDoctorData = (doctorId, setOnlineDoc, type, search) => {
  const id = doctorId.toString();
  console.log("Fetching doctor data for IDs:", id);
  
  const fetchDoctor = async () => {
    try {
      console.log("Making API request to:", `${API_BASE_URL}/doctor/${id}`);
      let res = await Axios.get(
        `${API_BASE_URL}/doctor/${id}`,
        {
          headers: {
            'x-acess-token': localStorage.getItem('token'),
          },
        }
      );
      
      if (!res || !res.data) {
        console.error("Invalid response format:", res);
        setOnlineDoc({
          data: [],
          isPending: false,
          error: "Failed to retrieve doctor data",
        });
        return;
      }
      
      let data = res.data.data;
      console.log("Received doctor data:", data);

      // Convert to array if not already
      if (!Array.isArray(data)) {
        console.log("Converting single doctor to array");
        data = [data];
      }
      
      //filter by type
      if (type !== 'All') {
        console.log(`Filtering doctors by specialization: ${type}`);
        let fDoc = data.filter(function (el) {
          return el && el.specialization && el.specialization.specialization === type;
        });
        data = fDoc;
        console.log(`Found ${data.length} doctors with specialization ${type}`);
      }

      //filtter by type
      if (search !== '') {
        let fDoc = data.filter(function (el) {
          return el.name.toLowerCase().includes(search.toLowerCase());
        });
        data = fDoc;
      }

      setOnlineDoc({
        data: data,
        isPending: false,
        error: null,
      });
    } catch (error) {
      console.log('err')
      setOnlineDoc({
        data: [],
        isPending: false,
        error: error,
      });
    }
  };
  fetchDoctor();
};

// eslint-disable-next-line no-unused-vars
const disconnectSocket = (socket) => {
  socket.disconnect();
};

// get specialization
const fetchSpecialization = (setSpec) => {
  const fetchType = async () => {
    try {
      let res = await Axios.get(`${API_BASE_URL}/specialization/`);
      let data = res.data.data;

      if (!Array.isArray(data)) {
        data = [data];
      }
      setSpec({
        data: data,
        isPending: false,
        error: null,
      });
    } catch (error) {
      setSpec({
        data: null,
        isPending: false,
        error: error,
      });
    }
  };
  fetchType();
};

export default Home;
