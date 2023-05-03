// Load gates.csv and phases.csv data
d3.csv("gates.csv").then(gatesData => {
    d3.csv("phases.csv").then(phasesData => {
        // Define margins, width, and height for the chart
        const margin = { top: 20, right: 20, bottom: 30, left: 40 };
        const width = 960 - margin.left - margin.right;
        const height = 500 - margin.top - margin.bottom;

        // Define scales and axes for the chart
        const x = d3.scaleBand()
            .rangeRound([0, width])
            .padding(0.1);
        const y = d3.scaleLinear()
            .rangeRound([height, 0]);
        const xAxis = d3.axisBottom(x);
        const yAxis = d3.axisLeft(y);

        // Create the SVG element and chart container
        const svg = d3.select("#chart")
            .append("svg")
            .attr("width", width + margin.left + margin.right)
            .attr("height", height + margin.top + margin.bottom)
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // Create a map to store gates data for easy lookup
        const gatesMap = new Map();
        gatesData.forEach(gate => {
            gatesMap.set(gate.Gate, {
                Widebody: +gate.Widebody || 0,
                Narrowbody: +gate.Narrowbody || 0
            });
        });

        // Prepare phase data for the chart
        const phases = phasesData.columns.slice(1);
        const phaseData = phases.map(phase => {
            let widebodyInbound = 0;
            let widebodyOutbound = 0;
            let narrowbodyInbound = 0;
            let narrowbodyOutbound = 0;
            const inactiveGates = [];

            // Calculate gates availability for each phase
            phasesData.forEach(row => {
                if (!row[phase]) {
                    const gateData = gatesMap.get(row.Gate);
                    widebodyInbound += gateData.Widebody;
                    widebodyOutbound += gateData.Widebody;
                    narrowbodyInbound += gateData.Narrowbody;
                    narrowbodyOutbound += gateData.Narrowbody;
                } else {
                    inactiveGates.push(row.Gate);
                }
            });

            return { 
                phase, 
                widebodyInbound, widebodyOutbound,
                narrowbodyInbound, narrowbodyOutbound,
                inactiveGates 
            };
        });

        // Define domains for the scales
        x.domain(phaseData.map(d => d.phase));
        y.domain([0, d3.max(phaseData, d => d.widebodyInbound + d.narrowbodyInbound + d.widebodyOutbound + d.narrowbodyOutbound) / 2 + 5]);

        // Add axes to the chart
        svg.append("g")
            .attr("class", "axis")
            .attr("transform", `translate(0,${height})`)
            .call(xAxis);
        svg.append("g")
            .attr("class", "axis")
            .call(yAxis)
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", 6)
            .attr("dy", ".71em")
            .style("text-anchor", "end")
            .text("Number of Gates");
        
        //Get current number of widebody and narrowbody jets
        const currentPhase = phaseData[0];
        const currentWidebodyJets = currentPhase.widebodyInbound;
        const currentNarrowbodyJets = currentPhase.narrowbodyInbound;

        // Add blue dotted line for Current widebody jet number
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(currentWidebodyJets))
            .attr("y2", y(currentWidebodyJets))
            .attr("stroke", "blue")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");

        // Add orange dotted line for Current narrowbody jet number
        svg.append("line")
            .attr("x1", 0)
            .attr("x2", width)
            .attr("y1", y(currentNarrowbodyJets + currentWidebodyJets))
            .attr("y2", y(currentNarrowbodyJets + currentWidebodyJets))
            .attr("stroke", "orange")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "5,5");

        // Create and position the bars for the chart
        const bar = svg.selectAll(".bar")
        .data(phaseData)
        .enter().append("g")
        .attr("class", "bar")
        .attr("transform", d => `translate(${x(d.phase)},0)`);

        // Define the bar width and padding
        const barWidth = x.bandwidth() / 2;
        const padding = 5;

        // Add the widebody inbound section of the bars
        bar.append("rect")
        .attr("y", d => y(d.widebodyInbound))
        .attr("height", d => height - y(d.widebodyInbound))
        .attr("width", barWidth)
        .attr("fill", "steelblue")
        .attr("class", "widebody-inbound");

        // Add the narrowbody inbound section of the bars
        bar.append("rect")
        .attr("y", d => y(d.widebodyInbound + d.narrowbodyInbound)) // Adjust the starting y-coordinate
        .attr("height", d => height - y(d.narrowbodyInbound))
        .attr("width", barWidth)
        .attr("fill", "orange")
        .attr("class", "narrowbody-inbound");

        // Add the widebody outbound section of the bars
        bar.append("rect")
        .attr("x", barWidth + padding)
        .attr("y", d => y(d.widebodyOutbound))
        .attr("height", d => height - y(d.widebodyOutbound))
        .attr("width", barWidth)
        .attr("fill", "steelblue")
        .attr("class", "widebody-outbound");

        // Add the narrowbody outbound section of the bars
        bar.append("rect")
        .attr("x", barWidth + padding)
        .attr("y", d => y(d.widebodyOutbound + d.narrowbodyOutbound)) // Adjust the starting y-coordinate
        .attr("height", d => height - y(d.narrowbodyOutbound))
        .attr("width", barWidth)
        .attr("fill", "orange")
        .attr("class", "narrowbody-outbound");

        // Add widebody label to the chart
        svg.append("text")
        .attr("x", width - 20)
        .attr("y", 20)
        .attr("text-anchor", "end")
        .style("fill", "steelblue")
        .text("Widebody");

        // Add narrowbody inbound label to the chart
        svg.append("text")
        .attr("x", width - 20)
        .attr("y", 40)
        .attr("text-anchor", "end")
        .style("fill", "orange")
        .text("Narrowbody");

        // Add Inbound label at the top of the bars
        bar.append("text")
        .attr("x", barWidth / 2)
        .attr("y", d => y(d.widebodyInbound + d.narrowbodyInbound) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Inbound");

        // Add Outbound label at the top of the bars
        bar.append("text")
        .attr("x", barWidth + padding + (barWidth / 2))
        .attr("y", d => y(d.widebodyOutbound + d.narrowbodyOutbound) - 5)
        .attr("text-anchor", "middle")
        .style("font-size", "10px")
        .text("Outbound");

        // Tooltip for hover information
        const tooltip = d3.select("body").append("div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        // Show tooltip, update gate colors, and highlight inactive gates on mouseover
        bar.on("mouseover", function (event, d) {
            // Show tooltip
            tooltip.transition()
                .duration(200)
                .style("opacity", .9);

                tooltip.html(`Widebody Inbound: ${d.widebodyInbound}<br>Narrowbody Inbound: ${d.narrowbodyInbound}<br>Widebody Outbound: ${d.widebodyOutbound}<br>Narrowbody Outbound: ${d.narrowbodyOutbound}`)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px");

            // Update gate colors for inactive gates
            d.inactiveGates.forEach(gate => {
                d3.select(`#gate-${gate}`).attr("fill", "red");
            });
        })
        .on("mousemove", function (event, d) {
            tooltip
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 30) + "px");
        })
        .on("mouseout", function (d) {
            // Hide tooltip
            tooltip.transition()
                .duration(500)
                .style("opacity", 0);

            // Reset gate colors
            gatesList.forEach(gate => {
                d3.select(`#gate-${gate}`).attr("fill", "green");
            });
        });

        // Prepare gates data for the grid visualization
        const gatesList = gatesData.map(gate => gate.Gate);
        const gridWidth = 1000;
        const gridSize = 80;
        const gridHeight = Math.ceil(gatesList.length / 10) * (gridSize + 10);
        const gridMargin = { top: 20, right: 20, bottom: 30, left: 40 };

        // Create the SVG element and grid container
        const gridSvg = d3.select("#grid")
            .append("svg")
            .attr("width", gridWidth + gridMargin.left + gridMargin.right)
            .attr("height", gridHeight + gridMargin.top + gridMargin.bottom)
            .append("g")
            .attr("transform", `translate(${gridMargin.left},${gridMargin.top})`);

        // Draw the left-aligned square grid for the gates
        gatesList.forEach((gate, index) => {
            const row = Math.floor(index / 10);
            const col = index % 10;

            gridSvg.append("rect")
                .attr("x", col * (gridSize + 10))
                .attr("y", row * (gridSize + 10))
                .attr("width", gridSize)
                .attr("height", gridSize)
                .attr("fill", "green")
                .attr("stroke", "white")
                .attr("id", `gate-${gate}`);

            gridSvg.append("text")
                .attr("x", col * (gridSize + 10) + gridSize / 2)
                .attr("y", row * (gridSize + 10) + gridSize / 2)
                .attr("text-anchor", "middle")
                .attr("dy", ".3em")
                .attr("fill", "white")
                .text(gate);
        });
    });
});

