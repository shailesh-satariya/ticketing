import axios from "axios";

const {useState} = require("react");

const useRequest = ({url, method, body, onSuccess}) => {
    const [errors, setErrors] = useState(null);

    const doRequest = async (props = {}) => {
        try {
            setErrors(null);
            const response = await axios[method](url, {...body, ...props});
            if (onSuccess) {
                onSuccess(response.data);
            }

            return response.data;
        } catch (err) {
            setErrors(
                <div className="alert alert-danger">
                    <h4>Ooops...</h4>
                    <ul>
                        {
                            err.response.data.errors.map((error) => <li key={error.message}>{error.message}</li>)
                        }
                    </ul>
                </div>
            );
        }
    };

    return [doRequest, errors];
};

export default useRequest;