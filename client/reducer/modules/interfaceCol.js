import axios from 'axios';
// Actions
const FETCH_INTERFACE_COL_LIST = 'yapi/interfaceCol/FETCH_INTERFACE_COL_LIST';
const FETCH_INTERFACE_COL_LIST_ALL = "yapi/interfaceCol/FETCH_INTERFACE_COL_LIST_ALL";
const FETCH_INTERFACE_COL_LIST_CHILD = "yapi/interfaceCol/FETCH_INTERFACE_COL_LIST_CHILD";
const FETCH_INTERFACE_COL_LIST_PID = "yapi/interfaceCol/FETCH_INTERFACE_COL_LIST_PID";
const FETCH_INTERFACE_COL_LIST_CONTAIN = "yapi/interfaceCol/FETCH_INTERFACE_COL_LIST_CONTAIN";
const FETCH_RUN_COL = 'yapi/interfaceCol/FETCH_RUN_COL';
const FETCH_DEL_COL = 'yapi/interfaceCol/FETCH_DEL_COL';
const FETCH_CASE_DATA = 'yapi/interfaceCol/FETCH_CASE_DATA';
const FETCH_CASE_LIST = 'yapi/interfaceCol/FETCH_CASE_LIST';
const SET_COL_DATA = 'yapi/interfaceCol/SET_COL_DATA';
const FETCH_VARIABLE_PARAMS_LIST = 'yapi/interfaceCol/FETCH_VARIABLE_PARAMS_LIST';
const FETCH_CASE_ENV_LIST = 'yapi/interfaceCol/FETCH_CASE_ENV_LIST';
const UP_COL_DATA = 'yapi/interfaceCol/UP_COL_DATA';
// Reducer
const initialState = {
  interfaceColList: [],
  interfaceColListall: [],
  interfaceColListchild:[],
  interfaceColListForPid:[],
  interfaceColcontainList:[],
  runCols:[],
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
    case FETCH_INTERFACE_COL_LIST: {
      return {
        ...state,
        interfaceColList: action.payload.data.data
      };
    }
    case FETCH_INTERFACE_COL_LIST_ALL: {
      return {
        ...state,
        interfaceColListall: action.payload.data.data
      };
    }
    case FETCH_INTERFACE_COL_LIST_CONTAIN: {
      return {
        ...state,
        interfaceColcontainList: action.payload.data.data
      };
    }
    case FETCH_INTERFACE_COL_LIST_CHILD: {
      return {
        ...state,
        interfaceColListchild: action.payload.data.data
      };
    }
    case FETCH_INTERFACE_COL_LIST_PID: {
      return {
        ...state,
        interfaceColListForPid: action.payload.data.data
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
    case FETCH_RUN_COL:{
      return {
        ...state, // 保留当前状态
        runCols: [...state.runCols, ...action.payload] // 合并新的 runCols 数据
      }
    }
    case FETCH_DEL_COL:{
      return {
        ...state, // 保留当前状态
        runCols: state.runCols.filter(colid => colid !== action.payload) // 删除指定 colid
      }
    }
    default:
      return state;
  }
};

// Action Creators
export async function fetchInterfaceColList(projectId, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/list?project_id=' + projectId, axiosOption);
    return {
      type: FETCH_INTERFACE_COL_LIST,
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

export async function fetchInterfaceColListall(projectId, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/listall?project_id=' + projectId, axiosOption);
    return {
      type: FETCH_INTERFACE_COL_LIST_ALL,
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

export async function fetchInterfaceColcontainList(ids, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/containList?ids=' + ids, axiosOption);
    return {
      type: FETCH_INTERFACE_COL_LIST_CONTAIN,
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
export async function fetchInterfaceColListForPid(col_id, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/list?parent_id=' + col_id, axiosOption);
    return {
      type: FETCH_INTERFACE_COL_LIST_PID,
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

export async function fetchInterfaceColListchild(col_id, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/case_listall?col_id=' + col_id, axiosOption);
    return {
      type: FETCH_INTERFACE_COL_LIST_CHILD,
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
export async function fetchRunCols(colid) {
  return {
    type: FETCH_RUN_COL,
    payload: [colid] // payload 是一个数组
  };
}
export async function fetchDelRunCols(colid) {
  return {
    type: FETCH_DEL_COL,
    payload: colid // payload 是要删除的 colid
  };
}
export async function fetchCaseData(caseId, axiosOption = {}) {
  try {
    const result = await axios.get('/api/col/case?caseid=' + caseId, axiosOption);
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
