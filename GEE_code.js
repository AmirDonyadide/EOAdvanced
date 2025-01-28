// Define the time period for analysis
var startDate = '2021-01-01';
var endDate = '2024-12-31';

// Get the geometries within the GeometryCollection
var geometries = aoi.geometries();

// Loop through each geometry and print its coordinates
geometries.evaluate(function(geoms) {
  geoms.forEach(function(geometry, index) {
    var coords = ee.Geometry(geometry).coordinates();
    print('Geometry ' + index + ' coordinates:', coords);
  });
});

// Calculate the area of the AOI (Area of Interest) in square kilometers
var aoiArea = aoi.area().divide(1e6); // Convert from square meters to square kilometers
print('AOI Area (sq. km):', aoiArea);

// Function to filter images based on AOI coverage
var filterByCoverage = function(image) {
  var intersection = image.geometry().intersection(aoi, ee.ErrorMargin(1)); // Find intersection with AOI
  var intersectionArea = intersection.area(); // Calculate intersection area
  var coveragePercentage = intersectionArea.divide(aoi.area()).multiply(100); // Calculate coverage as a percentage
  return image.set('coveragePercentage', coveragePercentage); // Add coverage percentage as metadata
};

// Filter and preprocess Sentinel-1 imagery
var s1 = ee.ImageCollection('COPERNICUS/S1_GRD')
  .filterBounds(aoi) // Filter by AOI
  .filterDate(startDate, endDate) // Filter by date range
  .filter(ee.Filter.eq('instrumentMode', 'IW')) // Use Interferometric Wide mode
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VV')) // Include VV polarization
  .filter(ee.Filter.listContains('transmitterReceiverPolarisation', 'VH')) // Include VH polarization
  .filter(ee.Filter.eq('orbitProperties_pass', 'ASCENDING')) // Use ascending orbit
  .map(filterByCoverage) // Add coverage percentage to metadata
  .filter(ee.Filter.gte('coveragePercentage', 70)); // Retain images with at least 80% coverage

// Print details about the filtered Sentinel-1 collection
print('Filtered Sentinel-1 Collection Size:', s1.size());

// Filter and preprocess Sentinel-2 imagery
var s2 = ee.ImageCollection('COPERNICUS/S2_SR')
  .filterBounds(aoi) // Filter by AOI
  .filterDate(startDate, endDate) // Filter by date range
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 20)) // Exclude cloudy images
  .map(filterByCoverage) // Add coverage percentage to metadata
  .filter(ee.Filter.gte('coveragePercentage', 70)); // Retain images with at least 70% coverage

// Print details about the filtered Sentinel-2 collection
print('Filtered Sentinel-2 Collection Size:', s2.size());

// Function to calculate NDWI for Sentinel-2
var calculateS2NDWI = function(image) {
  var ndwi = image.normalizedDifference(['B3', 'B8']).rename('NDWI'); // NDWI formula: (Green - NIR) / (Green + NIR)
  return image.addBands(ndwi).set('system:time_start', image.get('system:time_start'));
};

// Function to detect water in Sentinel-1 images using a VV/VH ratio threshold
var calculateS1Water = function(image) {
  var vv = image.select('VV'); // VV polarization
  var vh = image.select('VH'); // VH polarization
  var water = vv.divide(vh).lt(2).rename('Water'); // Simple threshold: VV/VH < 2 indicates water
  return image.addBands(water).set('system:time_start', image.get('system:time_start'));
};

// Apply water detection calculations
var s2WithNDWI = s2.map(calculateS2NDWI); // Add NDWI band to Sentinel-2 images
var s1WithWater = s1.map(calculateS1Water); // Add water detection band to Sentinel-1 images

// Combine Sentinel-2 and Sentinel-1 water information
var combineWater = function(s2Image) {
  var s1Image = s1WithWater.filterDate(s2Image.date(), s2Image.date().advance(1, 'day')).first(); // Find corresponding Sentinel-1 image
  var s2NDWI = s2Image.select('NDWI'); // NDWI from Sentinel-2
  var s1Water = ee.Image(ee.Algorithms.If(s1Image, s1Image.select('Water'), ee.Image(0))); // Use Sentinel-1 water data if available
  var combinedWater = s2NDWI.where(s2NDWI.mask().not(), s1Water).rename('CombinedWater'); // Combine the datasets
  return s2Image.addBands(combinedWater); // Add combined water data as a band
};

// Integrate Sentinel-1 water data into Sentinel-2 images
var combinedDataset = s2WithNDWI.map(combineWater);

// Calculate water area (in square kilometers) over AOI
var calculateWaterArea = function(image) {
  var waterArea = image.select('CombinedWater').gt(0) // Mask water areas
    .multiply(ee.Image.pixelArea().divide(1e6)) // Convert pixel area to square kilometers
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: 10,
      maxPixels: 1e13
    });
  
  return ee.Feature(null, {
    'waterArea': waterArea.get('CombinedWater'), // Water area in km^2
    'date': ee.Date(image.get('system:time_start')).format('YYYY-MM-dd') // Extract date
  });
};

// Create a time series of water area
var waterAreaTimeSeries = combinedDataset.map(calculateWaterArea);

// Convert time series to a FeatureCollection
var waterFeatures = ee.FeatureCollection(waterAreaTimeSeries);

// Print water area time series
print('Water Area Time Series:', waterFeatures);

// Display basic statistics for water area
var waterStats = waterFeatures.aggregate_stats('waterArea');
print('Water Area Statistics:', waterStats);

// Create a chart of water area over time
var chart = ui.Chart.feature.byFeature(waterFeatures, 'date', 'waterArea')
  .setOptions({
    title: 'Water Area Time Series (2015–2024)',
    hAxis: {title: 'Date', format: 'YYYY-MM-dd', gridlines: {count: 12}},
    vAxis: {title: 'Water Area (sq. Km)'},
    lineWidth: 2,
    pointSize: 4,
    colors: ['#1f77b4']
  });

// Display the chart
print(chart);

// Function to calculate water area (km²) for each image
var calculateWaterArea = function(image) {
  var waterArea = image.select('CombinedWater').gt(0) // Mask water areas
    .multiply(ee.Image.pixelArea().divide(1e6)) // Convert pixel area to square kilometers
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: aoi,
      scale: 10,
      maxPixels: 1e13
    });
  return image.set({
    'waterArea': waterArea.get('CombinedWater'), // Water area in km²
    'year': ee.Date(image.get('system:time_start')).get('year'), // Extract year
    'date': ee.Date(image.get('system:time_start')).format('YYYY-MM-dd') // Extract date
  });
};

// Filter and preprocess the combined dataset (NDWI and Sentinel-1 water data)
var combinedDatasetFiltered = combinedDataset.filterDate(startDate, endDate)
  .map(calculateWaterArea);
  
// Group water area by year
var waterByYear = combinedDatasetFiltered.reduceColumns({
  reducer: ee.Reducer.toList().repeat(2),
  selectors: ['year', 'waterArea']
});
var yearList = ee.List(waterByYear.get('list')).map(function(item) {
  return ee.List(item).get(0); // Extract years
}).distinct();
var waterAreaList = ee.List(waterByYear.get('list')).map(function(item) {
  return ee.List(item).get(1); // Extract water areas
});

// Calculate yearly means, below-average means, and above-average means
var yearlyMeans = yearList.map(function(year) {
  var year = ee.Number(year);
  var yearlyData = combinedDatasetFiltered.filter(ee.Filter.eq('year', year));
  var meanWater = yearlyData.aggregate_mean('waterArea');
  var belowAvg = yearlyData.filter(ee.Filter.lt('waterArea', meanWater)).aggregate_mean('waterArea');
  var aboveAvg = yearlyData.filter(ee.Filter.gt('waterArea', meanWater)).aggregate_mean('waterArea');
  return ee.Feature(null, {
    'year': year,
    'meanWater': meanWater,
    'belowAvg': belowAvg,
    'aboveAvg': aboveAvg
  });
});

// Create a FeatureCollection of yearly statistics
var yearlyStats = ee.FeatureCollection(yearlyMeans);

// Chart: Time series of water area
var chartTimeSeries = ui.Chart.feature.byFeature(combinedDatasetFiltered, 'date', 'waterArea')
  .setChartType('ScatterChart')
  .setOptions({
    title: 'Water Area Over Time',
    hAxis: {title: 'Date'},
    vAxis: {title: 'Water Area (sq. km)'},
    pointSize: 4,
    colors: ['#1f77b4']
  });
print(chartTimeSeries);

