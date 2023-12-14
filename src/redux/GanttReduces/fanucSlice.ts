import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import config from "../../config";
import moment from 'moment-timezone';

interface FetchFanucDataArgs {
  hours: number;
  machine?: string;
}

interface FanucData {
  time: number;
  run: number | null;
}

interface ApiResponseData {
  time: string; // assuming 'time' is a string in the API response
  run: number | null;
  // include other fields from the API response if there are any
}

interface FanucState {
  data: FanucData[];
  status: 'idle' | 'loading' | 'failed';
  message: string;
}

const initialState: FanucState = {
  data: [],
  status: 'idle',
  message: '',
};

export const fetchFanucData = createAsyncThunk(
  'fanuc/fetchData',
  async ({ hours, machine }: FetchFanucDataArgs) => {
    const response = await axios.get(`http://13.200.129.119:3000/v1/fanuc/feed_uptime/${machine}/${hours}`);
    console.log("response: ",response);
    const formattedData = response.data.map((item: ApiResponseData) => ({
      ...item,
      time: moment(item.time, "YYYY-MM-DD HH:mm:ss").valueOf() // Convert to Unix milliseconds
    }));
    return formattedData;
  }
);


// export const fetchFanucData = createAsyncThunk(
//   'fanuc/fetchData',
//   async ({ hours, machine }: FetchFanucDataArgs) => {
//     const response = await axios.get(`http://13.200.129.119:3000/v1/fanuc/feed_uptime/${machine}/${hours}`);
//     return response.data;
//   }
// );

const fanucSlice = createSlice({
  name: 'fanuc',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFanucData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchFanucData.fulfilled, (state, action) => {
        if (action.payload && action.payload.length > 0) {
          state.status = 'idle';
          state.data = action.payload;
          state.message = '';
        } else {
          state.status = 'idle';
          state.data = [];
          state.message = 'No data available for this specific period of time.';
        }
      })
      .addCase(fetchFanucData.rejected, (state) => {
        state.status = 'failed';
        state.data = [];
      });
  },
});

export default fanucSlice.reducer;
