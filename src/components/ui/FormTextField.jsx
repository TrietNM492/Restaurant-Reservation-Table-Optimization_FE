import Input from './Input';

export default function FormTextField(props) {
  return <Input className={`ui-form-text-field ${props.className || ''}`.trim()} {...props} />;
}