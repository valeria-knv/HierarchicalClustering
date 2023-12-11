window.onload = function () {
    var width, height, svg, path,
        years = [],
        margin = {top: 40, right: 15, bottom: 20, left: 40}, 
        chartWidth = 320,
        chartHeight = 350,
        tooltip, tooltipText;

    function init() {
        setMap();
    }

    function setMap() {
        width = window.innerWidth; 
        height = window.innerHeight;

        svg = d3.select('#map').append('svg')
            .attr('width', width)
            .attr('height', height);

        zoom = d3.behavior.zoom()
            .scaleExtent([1, 10])
            .on("zoom", zoomed);

        svg.call(zoom);

        var miller = d3.geo.miller()
          .scale(height / 4.35)
          .translate([width / 2.65, height / 2.1])
          .precision(.1);

        path = d3.geo.path().projection(miller);

        loadData();
    }

    function zoomed() {
        svg.selectAll(".country")
            .attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    }

    function loadData() {
        queue()
          .defer(d3.json, "../data/topoworld.json")
          .defer(d3.csv, "../data/Countries.csv")
          .await(processData);
    }

    function addToolTip() {
        tooltip = svg.append("g")
            .attr("transform", "translate(" + -1000 + "," + -1000 + ")")
            .attr("class", "tooltipchart");
        tooltip.append("rect")
            .attr("width", chartWidth + margin.left + margin.right)
            .attr("height", chartHeight + margin.top + margin.bottom);
        tooltipText = tooltip
            .append("text")
            .attr("class", "text")
            .attr("x", 15)
            .attr("y", 25);
    }

    function processData(error, worldMap, countryData) {
        var world = topojson.feature(worldMap, worldMap.objects.world);
        
        var countries = world.features;
        for (var i in countries) {
            for (var j in countryData) {
                if (countries[i].id == countryData[j]['Country Code']) {
                    for(var k in countryData[j]) {
                        if (k != 'Country' && k != 'Country Code') {
                            if (years.indexOf(k) == -1) { 
                                years.push(k);
                            }
                            countries[i].properties[k] = Number(countryData[j][k])
                        }
                    }
                    countries[i].country = countryData[j]["Country Name"];
                    break;
                }
            }
        }

        drawMap(world);
        updateInfoPanel("Ukraine", world.features.find(function (feature) {
                return feature.properties && feature.country === "Ukraine";
            }).properties);
    }

    function drawMap(world) {
        var delta = 10,
            tooltipWidth = margin.left + chartWidth + margin.right,
            tooltipHeight = margin.top + chartHeight + margin.bottom;
        var map = svg.append("g");
        map.selectAll(".country")
            .data(world.features)
            .enter().append("path")
            .attr("class", "country")
            .attr("d", path)
            .on("mousemove", function(d) {
                if (Object.keys(d.properties).length != 0) {
                    var xy = d3.mouse(this)
                        x = (xy[0] + delta),
                        y = (xy[1] - delta - tooltipHeight);
                    if (width - xy[0] < tooltipWidth) {
                        x = xy[0] - tooltipWidth - delta;
                    }
                    if (xy[1] < tooltipHeight) {
                        y = xy[1] + delta;
                    }
                    tooltip.attr("transform", "translate(" + x + "," + y + ")");
                }
            })
            .on("mouseout", function(d) {
                tooltip
                    .attr("transform", "translate(" + (-1000) + "," + (-1000) + ")");
                d3.select(this)
                    .style("stroke-width", 0.1);
            })
            .on("mouseover", function(d) {
                d3.select(this)
                    .style("stroke-width", 1.5);
                updateTooltipText(d.country, d.properties);
            })
            .on("click", function(d) {
                updateInfoPanel(d.country, d.properties);
            });

        sequenceMap();

        addToolTip();
    }

    function updateInfoPanel(country, data) {
        var infoPanel = d3.select("#info-panel");
        var infoContent = d3.select("#info-content");
    
        var formattedText = `
            <strong style="font-size: 18px; display: block; text-align: center; margin-bottom: 5px; font-weight: bold;">${country}</strong>
            <table style="width: 100%;">
        `;
    
        var dataArray = Object.entries(data).filter(([key]) => key !== 'Country Name' && key !== 'Country Code' && key !== 'Continent Name' && key !== 'Cluster');
    
        dataArray.forEach(([key, value]) => {
            formattedText += `
                <tr>
                    <td style="color: white; font-style: oblique; padding-right: 20px; text-align: right">${key}:</td> 
                    <td style="color: white; font-weight: bold;">${value}</td>
                </tr>
            `;
        });
    
        formattedText += `</table>`;
        
        infoContent.html(formattedText);
        infoPanel.style("display", "block");
    }

    function updateTooltipText(text, data) {
        var formattedText = `
            <tspan x="9%" font-weight="bold">${text}</tspan>
        `;
    
        var dataArray = Object.entries(data).filter(([key]) => key !== 'Country Name' && key !== 'Country Code' && key !== 'Continent Name');
    
        dataArray.forEach(([key, value]) => {
            formattedText += `
                <tspan dy="1.2em" x="10">${key}:</tspan>
                <tspan x="220"  font-weight="bold">${value}</tspan>
            `;
        });
    
        tooltipText.text(""); 
        tooltipText.html(formattedText);
        console.log(formattedText)
    }
    
    function sequenceMap() {
        d3.selectAll('.country')
            .style('fill', function(d) {
                return getRandomColor();
            });
    }

    function getRandomColor() {
        var randColors = [
            '#ADFF2F', '#7FFF00', '#00FF00', '#7CFC00', '#32CD32', 
            '#98FB98', '#90EE90', '#00FA9A', '#00FF7F', '#3CB371'
        ];
    
        return randColors[Math.floor(Math.random() * randColors.length)];
    }

    init();   
    
    var openModalBtn = document.getElementById('openDendrogram');
    var modal = document.getElementById('myModal');

    openModalBtn.addEventListener('click', function() {
        document.getElementById('info-panel').style.display = 'none';
        generateDendrogram();
        modal.style.display = 'block';
    });

    document.getElementsByClassName('close')[0].addEventListener('click', function() {
        document.getElementById("btnDendrogram").remove();
        document.getElementById("btnClusters").remove();
        modal.style.display = 'none';
        document.getElementById('info-panel').style.display = 'block';
    });

    window.addEventListener('click', function(event) {
        if (event.target === modal) {
            document.getElementById("btnDendrogram").remove();
            document.getElementById("btnClusters").remove();
            modal.style.display = 'none';
            document.getElementById('info-panel').style.display = 'block';
        }
    });
};

function dictToList(dict) {
    var list = [];
    for(var i in dict) {
        list.push([i, dict[i]]);
    }
    return list;
}
