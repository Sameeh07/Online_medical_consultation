// add doctor to database
import {useState,useEffect} from 'react';
import {useHistory} from 'react-router-dom';
import ConfirmIcon from '../../../img/confirm.png';
import Axios from 'axios';
const API_BASE_URL = process.env.REACT_APP_API_URL;

const AddDoctor = () => {
  const history = useHistory();

  // specialization
  const [specialization, setSpec] = useState({
    data: [],
    isPending: true,
    error: null,
  });
  
  // New state for adding a specialization
  const [newSpecialization, setNewSpecialization] = useState('');
  const [showAddSpecialization, setShowAddSpecialization] = useState(false);
  const [addingSpecialization, setAddingSpecialization] = useState(false);

  // doctor information
  const [name, setName] = useState();
  const [gender, setGender] = useState();
  const [SP, setSP] = useState();
  const [email, setEmail] = useState();
  const [phone, setPhone] = useState();
  const [password, setPassword] = useState();
  const [confirmPass, setConfirmPass] = useState();
  const [hospital, setHospital] = useState();
  const [background, setBackground] =useState();
  const [SD, setSD] = useState();
  const [photo, setPhoto] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSpecialization(setSpec); // get specialization
  }, [setSpec]);
  
  // Function to add a new specialization
  const handleAddSpecialization = async () => {
    if (!newSpecialization.trim()) {
      setError("Specialization name cannot be empty");
      return;
    }
    
    setAddingSpecialization(true);
    try {
      const response = await Axios.post(`${API_BASE_URL}/specialization/`, 
        { 
          specialization: newSpecialization,
          detail: 'Added from doctor creation'
        }, 
        config
      );
      
      // Update the specialization list
      if (response.data && response.data.data) {
        setSpec(prev => ({
          ...prev,
          data: [...(prev.data || []), response.data.data]
        }));
        // Select the new specialization
        setSP(response.data.data.id);
        setNewSpecialization('');
        setShowAddSpecialization(false);
      }
    } catch (err) {
      console.error("Error adding specialization:", err);
      setError(err.response?.data?.message || "Failed to add specialization");
    } finally {
      setAddingSpecialization(false);
    }
  };

  // token
  const config = {
    headers: {
      'x-acess-token': localStorage.getItem('token'),
    },
  };

  // add doctor
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (password !== confirmPass) {
      setError("Password Doesn't match");
      return;
    }
    
    // Validate required fields
    if (!email || !password) {
      setError("Email and password are required");
      return;
    }
    
    let formData = new FormData();
    formData.append('name', name || '');
    formData.append('gender', gender || 'Male');
    formData.append('specialization', SP || '---');
    formData.append('password', password);
    formData.append('email', email);
    formData.append('phone', phone || '');
    formData.append('hospital', hospital || 'Not specified');
    formData.append('specializationDetail', SD || '');
    formData.append('background', background || 'Not specified');
    if (photo) {
      formData.append('photo', photo);
    }

    Axios.post(`${API_BASE_URL}/doctor/`, formData, config)
      .then((res) => {
        return res.data;
      })
      .then(() => {
        history.goBack();
      })
      .catch((err) => {
        console.log(err.response?.data);
        setError(err.response?.data?.message || 'An error occurred');
      });
  };

  return (
    <div className='font-fontPro'>
      <div className='p-3'>
        <button className='text-base text-gray-700' onClick={history.goBack}>
          <i className='fas fa-chevron-left text-gray-700'></i>
          <span> Back</span>
        </button>
      </div>
      <div className='flex-col'>
        <div className='text-center mb-2'>
          <h1 className='text-2xl font-bold'>Add Doctor</h1>
        </div>

        <div className='flex justify-center px-20 py-2 mb-2'>
          <div
            className='bg-white shadow-xl w-2/3 overflow-hidden rounded-lg'
            style={{maxWidth: 1000}}
          >
            <form onSubmit={handleSubmit}>
              <div className='w-full py-10 px-5 md:px-10 bg-white'>
                <div className='flex -mx-3'>
                  <div className='w-2/5 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Name</label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                        onChange={(e) => setName(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                      />
                    </div>
                  </div>
                  <div className='w-1/5 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Gender</label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <select
                        onChange={(e) => setGender(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                      >
                        <option value="---">---</option>
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                      </select>
                    </div>
                  </div>
                  <div className='w-2/5 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Specialization</label>
                    <div className='flex flex-col'>
                      <div className='flex'>
                        <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                        {!showAddSpecialization ? (
                          <>
                            <select
                              onChange={(e) => setSP(e.target.value)}
                              className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                            >
                              <option value="---">---</option>
                              {specialization.data && specialization.data.length > 0 ? (
                                specialization.data.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.specialization}
                                  </option>
                                ))
                              ) : (
                                <option value="---">No specializations available</option>
                              )}
                            </select>
                            <button
                              type="button"
                              onClick={() => setShowAddSpecialization(true)}
                              className="ml-2 px-3 py-2 bg-blue-500 text-white rounded-lg"
                            >
                              +
                            </button>
                          </>
                        ) : (
                          <div className="flex w-full">
                            <input
                              value={newSpecialization}
                              onChange={(e) => setNewSpecialization(e.target.value)}
                              placeholder="Enter new specialization"
                              className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500'
                            />
                            <button
                              type="button"
                              onClick={handleAddSpecialization}
                              disabled={addingSpecialization}
                              className="ml-2 px-3 py-2 bg-green-500 text-white rounded-lg"
                            >
                              {addingSpecialization ? 'Adding...' : 'Add'}
                            </button>
                            <button
                              type="button"
                              onClick={() => setShowAddSpecialization(false)}
                              className="ml-2 px-3 py-2 bg-red-500 text-white rounded-lg"
                            >
                              Cancel
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className='flex -mx-3'>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Email <span className="text-red-500">*</span></label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                        onChange={(e) => setEmail(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                        required
                      />
                    </div>
                  </div>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>
                      Phone number
                    </label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                        onChange={(e) => setPhone(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                      />
                    </div>
                  </div>
                </div>
                <div className='flex -mx-3'>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Password <span className="text-red-500">*</span></label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                      type="password"
                        onChange={(e) => setPassword(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                        required
                      />
                    </div>
                  </div>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>
                      Confirm Password <span className="text-red-500">*</span>
                    </label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                      type="password"
                        onChange={(e) => setConfirmPass(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                        required
                      />
                    </div>
                  </div>
                </div>
                <div className='flex -mx-3'>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Hospital</label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                        onChange={(e) => setHospital(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                      />
                    </div>
                  </div>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Background</label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                        onChange={(e) => setBackground(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                      />
                    </div>
                  </div>
                  
                </div>
                <div className='flex -mx-3'>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>
                      Specialization detail
                    </label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <textarea
                        onChange={(e) => setSD(e.target.value)}
                        className='w-full -ml-10 pl-4 pr-3 py-2 rounded-lg border-2 border-gray-200 outline-none focus:border-indigo-500 '
                      />
                    </div>
                  </div>
                  <div className='w-1/2 px-3 mb-2'>
                    <label className='text-xs px-1 text-black'>Picture</label>
                    <div className='flex'>
                      <div className='w-10 z-10 pl-1 text-center pointer-events-none flex items-center justify-center' />
                      <input
                        type='file'
                        onChange={(e) => setPhoto(e.target.files[0])}
                        className='w-full -ml-10 pl-1 pr-3 py-2 rounded-lg outline-none focus:border-indigo-500 '
                      />
                    </div>
                  </div>
                </div>

                <div className='text-center'>
                  {error ? (
                    <h1 className='text-base text-red-700 font-normal'>
                      {error}
                    </h1>
                  ) : (
                    <span> </span>
                  )}
                </div>
                <div className='flex justify-end'>
                  <button
                    type='submit'
                    className='bg-green-400 hover:bg-green-500 font-bold py-2 px-4 mt-5 rounded inline-flex'
                  >
                    <img className='w-8 h-10 py-1 -mr-3' src={ConfirmIcon} alt=""/>
                    <div className='flex flex-col ml-5'>
                      <h1 className='py-2 text-xl text-white'>Confirm</h1>
                    </div>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

const fetchSpecialization = (setSpec) => {
  const fetchType = async () => {
    try {
      let res = await Axios.get(`${API_BASE_URL}/specialization/`);
      let data = res.data.data;

      if (!Array.isArray(data)) {
        data = [data];
      }
      
      // Handle the case when there's no data
      if (!data || data.length === 0) {
        console.log("No specialization data found");
      }
      
      setSpec({
        data: data,
        isPending: false,
        error: null,
      });
    } catch (error) {
      console.error("Error fetching specializations:", error);
      setSpec({
        data: [],
        isPending: false,
        error: error,
      });
    }
  };
  fetchType();
};

export default AddDoctor;