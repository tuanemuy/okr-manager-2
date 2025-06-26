export interface FormState<T = any, R = any> {
  input: T;
  result?: R;
  error: any;
}
