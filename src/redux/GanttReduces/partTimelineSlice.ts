import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import config from "../../config";
import moment from 'moment-timezone';

interface FetchPartTimelineDataArgs {
    hours: number;
    machine: string;
    observationName:string
  }
  interface PartTimelineState {
    data: any[];
    status: 'idle' | 'loading' | 'failed';
    message: string;
  }
  interface ApiResponseItem {
    time: string;
    // Add other fields from your API response here, for example:
    // someField: string;
    // anotherField: number;
  }
  
  export const fetchPartTimelineData = createAsyncThunk<any, FetchPartTimelineDataArgs, {}>(
    'partTimeline/fetchData',
    async ({ hours, machine, observationName}: FetchPartTimelineDataArgs) => {
      const response = await axios.get(`http://13.200.129.119:3000/v1/fanuc/data/${machine}/${hours}/${observationName}`);
      
      const formattedData = response.data.map((item: ApiResponseItem) => ({
        ...item,
        time: moment(item.time, "YYYY-MM-DD HH:mm:ss").valueOf() // Convert to Unix milliseconds
      }));
      
      return formattedData;
    }
  );
  
 
interface PartTimelineState {
  data: any[];
  status: 'idle' | 'loading' | 'failed';
  message: string;
}

const initialState: PartTimelineState = {
  data: [],
  status: 'idle',
  message: '',
};

const partTimelineSlice = createSlice({
  name: 'partTimeline',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPartTimelineData.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchPartTimelineData.fulfilled, (state, action: PayloadAction<any[]>) => {
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
      .addCase(fetchPartTimelineData.rejected, (state) => {
        state.status = 'failed';
        state.data = [];
      });
  },
});

export default partTimelineSlice.reducer;
