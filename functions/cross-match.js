const convertToLowercase = (headers) => {
    return [...headers].map(header => header.toLowerCase());
};

const returnDateTimestamp = (
    data,
    index,
    headers,
    headersMatch,
    isXLS,
) => {
    let dateStr = '';

    headersMatch.forEach(header => {
        const dataToMatchIndex = headers.indexOf(header);
        const loweredHeader = header.toLowerCase();

        if (loweredHeader === 'date') {
            let validDate = isXLS ? data[index][dataToMatchIndex] : data[index][header];
            let formDate = '';
            
            if (Object.prototype.toString.call(validDate) === '[object Date]') {
                formDate = `${validDate.getYear() + 1900}-${validDate.getMonth()+1}-${validDate.getDate()}`;
            }

            dateStr += `${formDate} `;
        } else if (loweredHeader === 'hour') {
            dateStr += `${isXLS ? data[index][dataToMatchIndex] : data[index][header]}:`;
        } else if (loweredHeader === 'minute') {
            dateStr += `${isXLS ? data[index][dataToMatchIndex] : data[index][header]}`;
        } else {
            dateStr += `${isXLS ? data[index][dataToMatchIndex] : data[index][header]}`;
        }
    });

    return new Date(dateStr).getTime();
};

const getLeads = (
    gaData, 
    clientData,
    gaFileType,
    clientFileType,
    matchBy = 'date',
    gaHeadersDeterminer,
    clientHeadersDeterminer,
    gaHeadersInclusion,
    thresholdParam = 60000, // 1 minute
) => {
    let gaHeaders = Object.keys(gaData[0]);
    let clientHeaders = Object.keys(clientData[0]);
    let gaStartingIndex = 0;
    let clientStartingIndex = 0;
    let matchedData = [];
    let unmatchedData = [];
    const gaHeadersMatch = gaHeadersDeterminer.split(',');
    const clientHeadersMatch = clientHeadersDeterminer.split(',');
    const gaHeadersInclusionMatch = gaHeadersInclusion.split(',');
    const isGaXLS = gaFileType.includes('spreadsheetml');
    const isClientXLS = clientFileType.includes('spreadsheetml');
    const threshold = parseInt(thresholdParam, 10);

    if (isGaXLS) {
        gaHeaders = gaData[0];
        gaStartingIndex = 1;
    }

    if (isClientXLS) {
        clientHeaders = clientData[0];
        clientStartingIndex = 1;
    }

    for (let clientIndex = clientStartingIndex; clientIndex < clientData.length; clientIndex++) {
        let clientDataToMatch;

        if (matchBy === 'date') {
            clientDataToMatch = returnDateTimestamp(
                clientData,
                clientIndex,
                clientHeaders,
                clientHeadersMatch,
                isClientXLS
            );

            
        } else if (matchBy === 'id') {
            const clientDataToMatchIndex = clientHeaders.indexOf(clientHeaders[0]);
            clientDataToMatch = isClientXLS ? clientData[clientIndex][clientDataToMatchIndex] : clientData[clientIndex][clientHeadersMatch[0]];
        }

        for (let gaIndex = gaStartingIndex; gaIndex < gaData.length; gaIndex++) {
            let gaDataToMatch;
    
            if (matchBy === 'date') {
                gaDataToMatch = returnDateTimestamp(
                    gaData,
                    gaIndex,
                    gaHeaders,
                    gaHeadersMatch,
                    isGaXLS
                );

                if (clientDataToMatch >= gaDataToMatch - threshold && clientDataToMatch <= gaDataToMatch + threshold) {
                    let gaInclusionObject = {};
                    gaHeadersInclusionMatch.forEach(header => {
                        const gaDataToMatchIndex = gaHeaders.indexOf(header);
                        gaInclusionObject = {
                            ...gaInclusionObject,
                            [header]: isGaXLS ? gaData[gaIndex][gaDataToMatchIndex] : gaData[gaIndex][header],
                        };
                    });

                    matchedData = matchedData.concat({
                        ...clientData[clientIndex],
                        ...gaInclusionObject,
                    });

                    break;
                }
            } else if (matchBy === 'id') {
                const gaDataToMatchIndex = gaHeaders.indexOf(gaHeadersMatch[0]);
                gaDataToMatch = isGaXLS ? gaData[gaIndex][gaDataToMatchIndex] : gaData[gaIndex][gaHeadersMatch[0]];
            }
    
            if (gaIndex + 1 === gaData.length) {
               unmatchedData = unmatchedData.concat(clientData[clientIndex]);
            }
        }
    }

    return {
        matchedData,
        unmatchedData,
    };
};

module.exports = {
    getLeads,
};