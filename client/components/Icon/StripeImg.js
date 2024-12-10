import React from 'react';
import PropTypes from 'prop-types';

const StripeImg = props =>{
  let length = props.length;
  return(
    <svg t="1724234390529" className="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="1611" width={length} height={length}><path d="M512 512m-448 0a448 448 0 1 0 896 0 448 448 0 1 0-896 0Z" fill="#676BE5" p-id="1612"></path><path d="M471.616 417.296c0-20.96 17.488-29.04 45.488-29.04a300.8 300.8 0 0 1 133.36 34.496v-126.224a353.6 353.6 0 0 0-133.264-24.528c-108.8 0-181.2 56.768-181.2 151.696 0 148.4 203.76 124.336 203.76 188.352 0 24.816-21.52 32.8-51.408 32.8a338.368 338.368 0 0 1-146.704-42.768v120.768a372.272 372.272 0 0 0 146.624 30.4c111.472 0 188.256-48 188.256-144.368 0-160-204.88-131.296-204.88-191.632" fill="#FFFFFF" p-id="1613"></path></svg>
  )
};

StripeImg.propTypes = {
  length: PropTypes.any
};

export default StripeImg;
