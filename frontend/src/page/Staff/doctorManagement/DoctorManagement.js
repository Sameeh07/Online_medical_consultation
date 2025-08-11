// frontend/src/page/Staff/doctorManagement/DoctorManagement.js
import React, { useEffect, useState } from 'react';
import useTokenCheck from '../../../helper/staffTokenCheck';
import Axios from 'axios';
import { Link } from 'react-router-dom';
import Spinner from '../../../components/Spinner';

const API_BASE_URL = process.env.REACT_APP_API_URL;

const DoctorManagement = () => {
  useTokenCheck(); // ensure staff is logged in

  const [doctor, setDoctor] = useState({
    data: [],
    isPending: true,
    error: null,
  });

  useEffect(() => {
    fetchDoctor(setDoctor);
  }, []);

  if (doctor.isPending) {
    return <Spinner />;
  }

  return (
    <div className="font-fontPro">
      <div className="mb-5 mt-10 mx-auto max-w-7xl w-full px-10 flex flex-col space-y-4">
        <div className="mx-auto max-w-7xl w-full flex justify-between mb-3">
          <h1 className="text-3xl">Doctor</h1>
          <Link
            to="/add/doctorManagement"
            className="px-4 py-2 rounded-md bg-indigo-500 hover:bg-indigo-600 text-white"
          >
            Add
          </Link>
        </div>

        <div className="flex flex-col">
          <div className="-my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
            <div className="py-2 align-middle inline-block min-w-full sm:px-6 lg:px-8">
              <div className="shadow overflow-hidden border-b border-gray-200 sm:rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        Doctor
                      </th>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        Specialization
                      </th>
                      <th className="px-6 py-3 text-left text-base font-medium text-gray-500 uppercase tracking-wider">
                        Hospital
                      </th>
                      <th className="px-6 py-3" />
                    </tr>
                  </thead>

                  <tbody className="bg-white divide-y divide-gray-200">
                    {doctor.data.map((d) => (
                      <tr key={d.id || Math.random()}>
                        {/* Name & Photo */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10">
                              <img
                                className="h-10 w-10 rounded-full"
                                src={d.photo}
                                alt={d.name}
                              />
                            </div>
                            <div className="ml-4">
                              <div className="text-base font-medium text-gray-900">
                                {d.name}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Specialization with safe access */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-base text-gray-900">
                            {d.specialization?.specialization || '—'}
                          </div>
                        </td>

                        {/* Hospital */}
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="px-2 inline-flex text-base leading-5 ">
                            {d.hospital}
                          </span>
                        </td>

                        {/* View Link */}
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <Link
                            to={`/staff/doctorManagement/${d.id}`}
                            className="text-purple-500 hover:text-pink-500"
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
};

const fetchDoctor = (setDoctor) => {
  const fetchData = async () => {
    try {
      const res = await Axios.get(
        `${API_BASE_URL}/doctor?sort=name`,
        {
          headers: { 'x-acess-token': localStorage.getItem('token') },
        }
      );
      let data = res.data.data;
      if (!Array.isArray(data)) data = [data];

      setDoctor({ data, isPending: false, error: null });
    } catch (err) {
      setDoctor({ data: [], isPending: false, error: err });
    }
  };

  fetchData();
};

export default DoctorManagement;
