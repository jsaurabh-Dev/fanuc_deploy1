// feedSlice.ts
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import config from "../../config";
import moment from 'moment-timezone';

interface FetchFeedDataArgs {
  hours: number;
  machine?: string;
}
interface ApiResponseData {
  time: string; // assuming 'time' is a string in the API response
  feed: number | null;
  // include other fields from the API response if there are any
}
export const fetchFeedData = createAsyncThunk(
  'fanuc/fetchData',
  async ({ hours, machine }: FetchFeedDataArgs) => {
    const response = await axios.get(`http://13.200.129.119:3000/v1/fanuc/feed_uptime/${machine}/${hours}`);
    console.log("response: ",response);
    const formattedData = response.data.map((item: ApiResponseData) => ({
      ...item,
      time: moment(item.time, "YYYY-MM-DD HH:mm:ss").valueOf() // Convert to Unix milliseconds
    }));
    return formattedData;
  }
);

interface FeedData {
  time: number;
  feed: number;
}

interface FeedState {
  data: FeedData[];
  status: 'idle' | 'loading' | 'failed';
  message: string;
}

const initialState: FeedState = {
  data: [],
  status: 'idle',
  message: '',
};

const feedSlice = createSlice({
  name: 'feed',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFeedData.pending, (state) => {
        state.status = 'loading';
        state.message = '';
      })
      .addCase(fetchFeedData.fulfilled, (state, action: PayloadAction<FeedData[]>) => {
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
      .addCase(fetchFeedData.rejected, (state) => {
        state.status = 'failed';
        state.data = [];
        state.message = 'An error occurred while fetching the data.';
      });
  },
});

export default feedSlice.reducer;
