const { JSDOM } = require('jsdom');
const d3 = require('d3');
const sharp = require('sharp');
const fetch = require('node-fetch');
const S3 = require('aws-sdk/clients/s3');

const client = new S3();

const store = buf => {
  return new Promise((resolve, reject) => {
    client.upload({
      Bucket: 'alchemyhackday',
      Key: `${Date.now()}.png`,
      Body: buf
    }, (err, results) => {
      if(err) reject(err);
      else resolve(results);
    });
  });
};

exports.handler = () => {
  return Promise.all([
    fetch('https://raw.githubusercontent.com/johan/world.geo.json/master/countries.geo.json')
      .then(res => res.json()),
    fetch('https://services9.arcgis.com/RHVPKKiFTONKtxq3/ArcGIS/rest/services/USA_Wildfires_v1/FeatureServer/1/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=&returnGeometry=true&returnCentroid=false&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pgeojson&token=')
      .then(res => res.json())
  ])
    .then(createMap);

  function createMap([json, fire]) {
    const dom = new JSDOM(`
    <svg id="content" width="800" height="500">
      <rect width="100%" height="100%" fill="white"/>
      <g class="map"/>
    </svg>`, { runScripts: 'outside-only' });

    const projection = d3
      .geoAlbers()
      .scale(1050)
      .translate([400, 260]);

    const generator = d3
      .geoPath()
      .projection(projection);

    const u = d3
      .select(dom.window.document)
      .select('#content g.map')
      .selectAll('path')
      .data([...json.features, ...fire.features]);

    u.enter()
      .append('path')
      .attr('d', generator)
      .style('fill', 'rgba(0,0,0,0)')
      .style('stroke', 'red')
      .style('stroke-width', 2);

    return sharp(Buffer.from(dom.window.document.querySelector('#content').outerHTML))
      .png()
      .toBuffer()
      .then(store);
  }
};
