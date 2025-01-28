
# Water Area Analysis in Eastern Venice

This repository contains the code, data, and analyses used for the study of water area changes in the eastern Venice region over a four-year period (2021–2024). The study investigates trends in water coverage, including yearly averages, minimum and maximum values, and deviations above and below average, with a focus on understanding long-term patterns and their implications.

---

## Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Setup and Installation](#setup-and-installation)
- [Usage](#usage)
- [Data](#data)
- [Results](#results)
- [Contributing](#contributing)
- [License](#license)

---

## Overview
This project analyzes water dynamics in the coastal region of Venice, Italy, using NDWI (Normalized Difference Water Index) calculations. It highlights the significant increase in water coverage over the years, even during periods of low water levels, emphasizing the impact of environmental and climatic changes on this vital region.

The key objectives of the study are:
1. To quantify water area changes between 2021 and 2024.
2. To analyze deviations below and above yearly average water areas.
3. To identify patterns and trends in minimum and maximum water levels.

---

## Features
- **NDWI Calculation**: Compute water coverage using Landsat data.
- **Yearly Analysis**: Assess annual trends, including minimum and maximum values.
- **Visualizations**: Generate NDWI maps and statistical charts for analysis.
- **Insights**: Highlight key findings, such as increasing water coverage trends.

---

## Setup and Installation
### Prerequisites
- Python 3.8 or later
- Google Earth Engine Python API
- Required Python libraries: `numpy`, `matplotlib`, `pandas`, `geemap`

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/water-area-analysis.git
   ```
2. Navigate to the project directory:
   ```bash
   cd water-area-analysis
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Authenticate with Google Earth Engine:
   ```bash
   earthengine authenticate
   ```

---

## Usage
1. **Run the main analysis script**:
   ```bash
   python main_analysis.py
   ```
2. **Generate visualizations**:
   Use `visualization_script.py` to create NDWI maps and trend charts.
3. **Explore results**:
   Outputs will include water coverage statistics, charts, and NDWI maps saved in the `output` folder.

---

## Data
- **Satellite Data**: Landsat 7, 8, and 9 imagery accessed via Google Earth Engine.
- **Region**: Eastern coast of Venice, Italy.
- **Timeframe**: 2021–2024.

---

## Results
The study found:
1. A steady increase in water area across the years.
2. Seasonal variations in minimum and maximum water levels.
3. Larger water coverage even on historically low water days in recent years.

Visual results, including NDWI maps and statistical trends, can be found in the `results` folder.

---

## Contributing
Contributions are welcome! If you have suggestions for improvements or additional features, please fork the repository and submit a pull request. For major changes, please open an issue to discuss your ideas.

---

## License
This project is licensed under the [MIT License](LICENSE). You are free to use, modify, and distribute this project as long as the original license is included.

---

## Contact
For questions or further information, please contact:
- **Name**: [Your Name]
- **Email**: [your.email@example.com]
- **GitHub**: [https://github.com/your-username](https://github.com/your-username)
