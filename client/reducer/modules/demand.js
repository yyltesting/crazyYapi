import axios from 'axios';
// Actions
const DEMAND_LIST = 'yapi/demand/DEMAND_LIST';
const FETCH_CASE_DATA = 'yapi/interfaceCol/FETCH_CASE_DATA';
const FETCH_CASE_LIST = 'yapi/interfaceCol/FETCH_CASE_LIST';
const SET_COL_DATA = 'yapi/interfaceCol/SET_COL_DATA';
const FETCH_VARIABLE_PARAMS_LIST = 'yapi/interfaceCol/FETCH_VARIABLE_PARAMS_LIST';
const FETCH_CASE_ENV_LIST = 'yapi/interfaceCol/FETCH_CASE_ENV_LIST';
const UP_COL_DATA = 'yapi/interfaceCol/UP_COL_DATA';
// Reducer
const initialState = {
  demandlist: [],
  isShowCol: true,
  isRender: false,
  currColId: 0,
  currCaseId: 0,
  currCase: {},
  currCaseList: [],
  variableParamsList: [],
  envList: [],
  colrequest:{}
};

export default (state = initialState, action) => {
  switch (action.type) {
    case DEMAND_LIST: {
      return {
        ...state,
        demandlist: action.payload.data.data
      };
      
    }
    case FETCH_CASE_DATA: {
      return {
        ...state,
        currCase: action.payload.data.data
      };
    }
    case FETCH_CASE_LIST: {
      return {
        ...state,
        currCaseList: action.payload.data.data,
        colrequest:action.payload.data.colData
      };
    }

    case FETCH_VARIABLE_PARAMS_LIST: {
      return {
        ...state,
        variableParamsList: action.payload.data.data
      };
    }
    case SET_COL_DATA: {
      return {
        ...state,
        ...action.payload
      };
    }
    case UP_COL_DATA: {
      return {
        ...state,
        ...action.payload
      };
    }
    case FETCH_CASE_ENV_LIST: {
      return {
        ...state,
        envList: action.payload.data.data
      };
    }
    default:
      return state;
  }
};

// Action Creators
export async function demandlist(projectId) {
  try {
    const result = await axios.get('/api/demand/list?project_id=' + projectId);
    return {
      type: DEMAND_LIST,
      payload: result
    };
  } catch (e) {
    if (axios.isCancel(e)) {
      return {
        type: '',
        payload: e
      };
    } else {
      throw e;
    }
  }
}

export async function fetchCaseData(projectId, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/case?caseid=' + projectId, axiosOption);
    return {
      type: FETCH_CASE_DATA,
      payload: result
    };
  } catch (e) {
    if (axios.isCancel(e)) {
      return {
        type: '',
        payload: e
      };
    } else {
      throw e;
    }
  }
}

export async function fetchCaseList(colId, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/case_list/?col_id=' + colId, axiosOption);
    return {
      type: FETCH_CASE_LIST,
      payload: result
    };
  }catch (e) {
    if (axios.isCancel(e)) {
      return {
        type: '',
        payload: e
      };
    } else {
      throw e;
    }
  }
}

export async function fetchCaseEnvList(col_id, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/case_env_list', {
      params: { col_id },
      ...axiosOption
    });
    return {
      type: FETCH_CASE_ENV_LIST,
      payload: result
    };
  } catch (e) {
    if (axios.isCancel(e)) {
      return {
        type: '',
        payload: e
      };
    } else {
      throw e;
    }
  }
}

export function fetchVariableParamsList(colId) {
  return {
    type: FETCH_VARIABLE_PARAMS_LIST,
    payload: axios.get('/api/col/case_list_by_var_params?col_id=' + colId)
  };
}

export function setColData(data) {
  return {
    type: SET_COL_DATA,
    payload: data
  };
}
export function upColData(data) {
  return {
    type: UP_COL_DATA,
    payload: axios.post('/api/col/upcolrequest', data)
  };
}
