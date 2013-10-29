require 'json'

file = File.read '02_stats.json'
data = JSON.parse(file)

data.each do |key, datapoints|
    ids = datapoints.values.map(&:keys).flatten.uniq
    File.open(key+".csv", "w") do |f|
        f.write ["timestamps", ids].flatten.join(",")+"\n"

        rows = []

        datapoints.each do |timestamp, instancedata|
            row = [timestamp]
            ids.each {|id| row << (instancedata[id] || "") }
            rows << row.join(",")
        end

        f.write rows.sort.join("\n")
    end
end
