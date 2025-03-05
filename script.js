// 真實的船舶 AIS 資料


// 初始化地圖，使用高雄港的座標
const map = L.map('map', {
    center: [22.604799, 120.2976256],
    zoom: 16
});

// 添加地圖圖層
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
}).addTo(map);

// 定義不同類型船舶的圖標
const shipIcons = {
    'Vessel-Fishing': new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    'Cargo-all ships of this type': new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    'Tug': new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    'Tanker-all ships of this type': new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    'Vessel-Towing': new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    }),
    'default': new L.Icon({
        iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
        shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34],
        shadowSize: [41, 41]
    })
};

// 修改標記群組的創建部分
const markers = new L.MarkerClusterGroup({
    maxClusterRadius: 30,  // 降低群集半徑（從120改為30）
    spiderfyOnMaxZoom: true,
    showCoverageOnHover: true,
    zoomToBoundsOnClick: true,
    disableClusteringAtZoom: 14,  // 添加此行：在縮放級別14及以上時禁用群集
    iconCreateFunction: function(cluster) {
        var childCount = cluster.getChildCount();
        var c = ' marker-cluster-';
        if (childCount < 5) {  // 降低群集的數量閾值
            c += 'small';
        } else if (childCount < 10) {
            c += 'medium';
        } else {
            c += 'large';
        }
        return new L.DivIcon({
            html: '<div><span>' + childCount + '</span></div>',
            className: 'marker-cluster' + c,
            iconSize: new L.Point(40, 40)  // 稍微縮小群集圖標
        });
    }
});

// 為每艘船添加標記


// 將標記群組添加到地圖
map.addLayer(markers);

// 添加圖例到地圖
const legend = L.control({ position: 'bottomright' });

legend.onAdd = function(map) {
    const div = L.DomUtil.create('div', 'info legend');
    div.style.backgroundColor = 'white';
    div.style.padding = '10px';
    div.style.border = '1px solid #ccc';
    div.style.borderRadius = '5px';
    
    div.innerHTML = `
        <h4>船舶類型</h4>
        <div><img src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png" width="12"> 漁船</div>
        <div><img src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png" width="12"> 貨船</div>
        <div><img src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-yellow.png" width="12"> 拖船</div>
        <div><img src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-orange.png" width="12"> 油輪</div>
        <div><img src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png" width="12"> 拖曳船</div>
        <div><img src="https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png" width="12"> 其他</div>
    `;
    
    return div;
};

legend.addTo(map);

// Function to load ships from CSV
function loadShipsFromCSV(url) {
    fetch(url)
        .then(response => response.text())
        .then(csvText => {
            const ships = parseCSV(csvText);
            if (ships && ships.length > 0) {
                addShipsToMap(ships);
            } else {
                console.error('No ship data found.');
            }
        })
        .catch(error => console.error('Error loading CSV:', error));
}

// Function to parse CSV text into JSON
function parseCSV(csvText) {
    const lines = csvText.trim().split("\n");
    const headers = lines[0].split(",");
    const data = lines.slice(1).map(line => {
        const values = line.split(",");
        let ship = {};
        headers.forEach((header, index) => {
            ship[header.trim()] = values[index].trim();
        });
        return ship;
    });
    console.log(data); // 检查解析后的数据
    return data;
}

// Function to add ships to the map
function addShipsToMap(ships) {
    const markers = new L.MarkerClusterGroup({
        maxClusterRadius: 30,
        spiderfyOnMaxZoom: true,
        showCoverageOnHover: true,
        zoomToBoundsOnClick: true,
        disableClusteringAtZoom: 14,
        iconCreateFunction: function(cluster) {
            var childCount = cluster.getChildCount();
            var c = ' marker-cluster-';
            if (childCount < 5) {
                c += 'small';
            } else if (childCount < 10) {
                c += 'medium';
            } else {
                c += 'large';
            }
            return new L.DivIcon({
                html: '<div><span>' + childCount + '</span></div>',
                className: 'marker-cluster' + c,
                iconSize: new L.Point(40, 40)
            });
        }
    });

    ships.forEach(ship => {
        const position = [parseFloat(ship.Latitude), parseFloat(ship.Longitude)];
        const icon = shipIcons[ship.Ship_Type] || shipIcons['default'];
        const marker = L.marker(position, { icon }).bindPopup(`
            <h3>${ship.Vessel_Name}</h3>
            <p>時間: ${ship.Received_Time}</p>
            <p>速度: ${ship.SOG} 節</p>
            <p>航向: ${ship.COG}°</p>
            <p>類型: ${ship.Ship_Type}</p>
        `);
        markers.addLayer(marker);
    });

    map.addLayer(markers);
}

// Load the CSV from the GitHub URL
const githubCSVUrl = "https://raw.githubusercontent.com/ZhenYu0918/114_project/refs/heads/main/data.csv";
loadShipsFromCSV(githubCSVUrl); 